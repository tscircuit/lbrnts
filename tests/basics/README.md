# LightBurn Basics Test Suite

This directory contains snapshot tests for various LightBurn project files (.lbrn and .lbrn2) to exercise different parser features.

## Test Files

### .lbrn (v1) Tests

1. **basics01.test.ts** - `Lightburn_Test_Pattern.lbrn`
   - General test pattern
   - Features: multiple layers & operations, mixed simple geometry, basic text
   - Source: maker-z/LightBurnTestFiles

2. **basics02.test.ts** - `PowerScale_Test_01_Rico.lbrn`
   - Power/speed "power scale" grid
   - Features: lots of shapes sharing a layer but with differing cut settings
   - Good for: parameter parsing
   - Source: makerspace-gt/lightburn-settings

3. **basics03.test.ts** - `example1.lbrn`
   - Setting-combination generator output
   - Features: many repetitive objects with systematic parameter variation
   - Source: MarcinZukowski/lightburn-tester

4. **basics04.test.ts** - `example2.lbrn`
   - Setting-combination generator output
   - Features: many repetitive objects with systematic parameter variation
   - Source: MarcinZukowski/lightburn-tester

### .lbrn2 (v2) Tests

5. **basics05.test.ts** - `ZippoLighter.lbrn2`
   - Variable Text + CutSettings + transforms
   - Features: `<VariableText>`, `<CutSetting>`, `<Shape Type="Rect">`, `<XForm>` matrix parsing
   - Source: JTCozart/LightBurnTemplates

6. **basics06.test.ts** - `printable_area_jig.lbrn2`
   - Alignment/fixture template
   - Features: rectangles, labels, alignment geometry; grouped shapes & text
   - Source: JTCozart/LightBurnTemplates

7. **basics07.test.ts** - `black_acrilic_sample_burn.lbrn2`
   - Material test card
   - Features: multi-layer settings & repeated geometry
   - Source: JTCozart/LightBurnTemplates

8. **basics08.test.ts** - `images.lbrn2`
   - Bitmap/engrave objects
   - Features: `<Shape Type="Bitmap">` handling and embedded image data
   - Source: qbalsdon/etcher

9. **basics09.test.ts** - `iso_keyboard.lbrn2`
   - Dense holes/paths
   - Features: many paths with interior holes, arrays of similar parts
   - Good for: path topology stress test
   - Source: qbalsdon/etcher

10. **basics10.test.ts** - `switch_plate.lbrn2`
    - Cutouts & radii
    - Features: mixed rectangles/circles, rounded corners, consistent transforms
    - Source: qbalsdon/etcher

11. **basics11.test.ts** - `Grid.lbrn2`
    - Coordinate grid
    - Features: many lines/text labels; checks text objects and lots of simple strokes
    - Source: qbalsdon/etcher

12. **basics12.test.ts** - `Absolute_Coordinate_Grid.lbrn2`
    - Labelled bed/grid
    - Features: text + linework + alignment features
    - Source: thatDIYlife/absolute-coordinate-grid

13. **basics13.test.ts** - `LockingJig_Fence.lbrn2`
    - Jig geometry
    - Features: parametric-looking tooth profiles (lots of short segments), groups, transforms
    - Source: thatDIYlife/laser-engraving-locking-teeth-jig

14. **basics14.test.ts** - `LockingJig_Teeth.lbrn2`
    - Jig geometry with tooth profiles
    - Features: parametric-looking tooth profiles (lots of short segments), groups, transforms
    - Source: thatDIYlife/laser-engraving-locking-teeth-jig

15. **basics15.test.ts** - `face_avant_lightburn.lbrn2`
    - Mechanical part
    - Features: polylines, arcs, hole patterns; geometry-heavy sample
    - Source: rchateauneu/meccano_laser_cut

16. **basics16.test.ts** - `lightburn_front_panels.lbrn2`
    - Front panel layouts
    - Features: lots of circles, text labels, grouped entities; checks layer/color mapping and text baselines
    - Source: upiir/custom_front_panels

## Feature Coverage Map

- **Layers & CutSettings**: basics05, basics06, basics07, basics01-04
- **Transforms (`<XForm>` matrices)**: basics05, and most others
- **Variable Text**: basics05 (explicit `<VariableText>`)
- **Bitmap/embedded images**: basics08
- **Bezier & line paths, groups**: basics09, basics13, basics14, basics15
- **Dense topology / holes**: basics09, basics10, basics14
- **Text objects**: basics06, basics11, basics12, basics16, basics05

## Running Tests

Run all basic tests:
```bash
bun test tests/basics
```

Run a specific test:
```bash
bun test tests/basics/basics01.test.ts
```

Update snapshots:
```bash
BUN_UPDATE_SNAPSHOTS=1 bun test tests/basics
```
