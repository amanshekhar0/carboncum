const { exec } = require('child_process');
const User = require('../models/User');

/**
 * IdleSleeper Job (Windows Version)
 * Tracks idle time, triggers actual sleep, and awards points for saved energy.
 */

const IDLE_THRESHOLD_SECONDS = 60;
const POLLING_INTERVAL_MS = 5000;
let isSleeping = false;

console.log('[IdleSleeper] Professional Service active.');

const checkIdleTime = async () => {
  if (isSleeping) return;

  try {
    const psCommand = `
      $lastInput = Add-Type -MemberDefinition @'
      [DllImport("user32.dll")] public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
      [StructLayout(LayoutKind.Sequential)] public struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
'@ -Name "Win32" -Namespace "Win32" -PassThru
      $lii = New-Object Win32.Win32+LASTINPUTINFO
      $lii.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($lii)
      if ($lastInput::GetLastInputInfo([ref]$lii)) {
        $idleMs = [Environment]::TickCount - $lii.dwTime
        Write-Output $idleMs
      }
    `;

    exec(`powershell -NoProfile -Command "${psCommand.replace(/\n/g, ' ')}"`, async (err, stdout) => {
      if (err) return;
      
      const idleMs = parseInt(stdout.trim());
      const idleSeconds = idleMs / 1000;

      if (idleSeconds >= IDLE_THRESHOLD_SECONDS && !isSleeping) {
        console.log(`[IdleSleeper] Threshold reached (${Math.floor(idleSeconds)}s). Calculating savings...`);
        
        isSleeping = true;

        // 1. Award points for the idle time spent *before* sleeping
        try {
          const user = await User.findOne().sort({ updatedAt: -1 }); // Get last active user
          if (user) {
            const carbonSaved = (idleSeconds / 3600) * 0.5; // 0.5kg saved per hour of idle
            const points = Math.max(5, Math.round(carbonSaved * 100));
            
            user.totalCarbonSaved += carbonSaved;
            user.ecoPoints += points;
            user.recalculateEcoScore();
            await user.save();
            
            // 🌐 Real-Time Update
            const { emitUpdate } = require('../services/SocketService');
            emitUpdate(user._id.toString(), {
              id: user._id,
              name: user.name,
              ecoScore: user.ecoScore,
              currentStreak: user.currentStreak,
              totalCarbonSaved: user.totalCarbonSaved,
              totalRupeesSaved: user.totalRupeesSaved
            });
            
            console.log(`[IdleSleeper] Awarded ${points} pts to ${user.name} for ${Math.floor(idleSeconds)}s idle.`);
          }
        } catch (dbErr) {
          console.error('[IdleSleeper] DB Update failed:', dbErr.message);
        }

        // 2. Trigger Actual Sleep
        console.log('[IdleSleeper] Entering System Sleep mode...');
        
        // Use PowerShell for a more reliable sleep command
        const sleepCmd = 'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState([System.Windows.Forms.PowerState]::Suspend, $false, $false)"';
        
        exec(sleepCmd, () => {
          // This executes when system wakes up
          console.log('[IdleSleeper] System Woke Up. Resuming monitor...');
          isSleeping = false;
        });
      }
    });
  } catch (err) {
    isSleeping = false;
  }
};

// Start the loop
const startSleeper = () => {
  setInterval(checkIdleTime, POLLING_INTERVAL_MS);
};

// If this script is run directly
if (require.main === module) {
  startSleeper();
}

module.exports = { startSleeper };
