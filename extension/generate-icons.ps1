# Generates icon16.png, icon48.png, icon128.png for the CarbonTwin extension.
# Theme: emerald-green circle with a stylized white leaf.
#
# Run from the repo root:
#   powershell -ExecutionPolicy Bypass -File extension\generate-icons.ps1

Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot 'icons'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$bg     = [System.Drawing.Color]::FromArgb(255, 16, 185, 129)   # #10b981
$bgDark = [System.Drawing.Color]::FromArgb(255,  5, 150, 105)   # #059669
$leaf   = [System.Drawing.Color]::White
$vein   = [System.Drawing.Color]::FromArgb(220, 5, 150, 105)

foreach ($size in 16, 48, 128) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Radial-ish gradient circle (top-left lighter, bottom-right darker).
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect, $bg, $bgDark,
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
    $g.FillEllipse($brush, 0, 0, $size - 1, $size - 1)
    $brush.Dispose()

    # Leaf — drawn as a closed bezier path inside a centered box.
    $pad   = [int]([Math]::Round($size * 0.22))
    $boxL  = $pad
    $boxT  = $pad
    $boxR  = $size - $pad
    $boxB  = $size - $pad
    $w     = $boxR - $boxL
    $h     = $boxB - $boxT

    $leafBrush = New-Object System.Drawing.SolidBrush($leaf)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p1 = New-Object System.Drawing.PointF($boxL,                  ($boxT + $h * 1.0))
    $p2 = New-Object System.Drawing.PointF(($boxL - $w * 0.05),    ($boxT + $h * 0.35))
    $p3 = New-Object System.Drawing.PointF(($boxL + $w * 0.55),    ($boxT - $h * 0.05))
    $p4 = New-Object System.Drawing.PointF($boxR,                  $boxT)
    $p5 = New-Object System.Drawing.PointF(($boxR - $w * 0.05),    ($boxT + $h * 0.55))
    $p6 = New-Object System.Drawing.PointF(($boxL + $w * 0.45),    ($boxT + $h * 1.05))
    $path.AddBezier($p1, $p2, $p3, $p4)
    $path.AddBezier($p4, $p5, $p6, $p1)
    $path.CloseFigure()
    $g.FillPath($leafBrush, $path)

    # Central vein down the leaf.
    $veinPen = New-Object System.Drawing.Pen($vein, [Math]::Max(1.0, $size / 32.0))
    $veinPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $veinPen.EndCap   = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($veinPen, $p1, $p4)
    $veinPen.Dispose()

    $path.Dispose()
    $leafBrush.Dispose()

    $outFile = Join-Path $outDir ("icon{0}.png" -f $size)
    $bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()

    Write-Host ("  wrote {0} ({1}x{1})" -f $outFile, $size)
}

Write-Host "Done. Reload the unpacked extension in chrome://extensions."
