# Report Images

Place real screenshot images here to embed them automatically into the PDF report.

## Naming Convention
Use figure_<chapter>_<index>.<ext> where the dot in the figure number is replaced by an underscore.

Examples:
- Figure 6.3  -> figure_6_3.png
- Figure 6.4  -> figure_6_4.jpg
- Figure 6.10 -> figure_6_10.png

Supported extensions: png, jpg, jpeg (prefer PNG for sharp UI rendering).

## Recommended Dimensions
- Aspect ratio: 16:9 or 4:3.
- Minimum width: 1000px for clarity when scaled down.
- Avoid very tall images; crop unnecessary browser chrome.

## Tips
- Use consistent browser zoom (100%).
- Hide sensitive data before capturing.
- For theme comparison (Figure 6.10), create a single composite image (light left, dark right).
- For error states (Figure 6.11) you can stitch multiple smaller screenshots into one.

After adding images, regenerate the PDF:
`node scripts/generate_college_report.js`

Images present will replace the placeholder drawing for that figure automatically.
