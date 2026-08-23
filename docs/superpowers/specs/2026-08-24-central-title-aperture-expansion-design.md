# Central Title Aperture 20% Expansion Design

## Context

The centered philosophy title already uses a text-bounded quiet aperture. Its
fully off-white core is correct, but the surrounding feather should reach
slightly farther into the living-scale field. The user approved a 20% increase.

## Decision

Expand only the central title aperture's horizontal and vertical feather by an
exact factor of `1.2`. Keep the measured text bounds and fully off-white core
unchanged. This preserves the current hierarchy while making the transition
into the scale field feel less tight.

## Parameter changes

The following `QUIET_APERTURE` values change in
`src/lib/openboa/quiet-aperture.ts`:

| Parameter | Current | Approved |
| --- | ---: | ---: |
| `featherXMin` | `44` | `52.8` |
| `featherXMax` | `136` | `163.2` |
| `featherXViewportRatio` | `0.10625` | `0.1275` |
| `featherYMin` | `58` | `69.6` |
| `featherYMax` | `92` | `110.4` |
| `featherYViewportRatio` | `0.071875` | `0.08625` |

Scaling the minimum, maximum, and viewport ratio together keeps the increase at
20% across every responsive clamp state.

## Preserved behavior

- `innerEdge: 0.45` remains unchanged, so the completely off-white core does
  not grow.
- `shapePower`, `motionFloor`, `colorMix`, scale colors, scale movement, and
  cursor interaction remain unchanged.
- Header, Products dropdown, footer, and social apertures remain unchanged.
- Title copy, typography, spacing, and layout remain unchanged.

## Verification

- Add a contract check that locks all six approved feather values and confirms
  `innerEdge` remains `0.45`.
- Run token, responsive, lint, type, and production-build checks.
- Inspect the centered title at the same browser viewport before and after the
  change, including the Products-open state.
- Confirm the browser reports no warning or error logs.

## Rollback

The pre-expansion implementation remains available at commit `eb5c5a4`. The
approved pre-token landing remains preserved on
`backup/landing-v33-20260823` at `8bfc4d2`.
