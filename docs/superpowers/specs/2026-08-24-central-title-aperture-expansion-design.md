# Central Title Aperture Balance Design

## Context

The centered philosophy title uses a text-bounded quiet aperture. The final
approved balance keeps the surrounding feather 20% wider than the original
baseline while expanding the fully off-white center inside the measured title
bounds.

## Decision

Expand the central title aperture's horizontal and vertical feather by an exact
factor of `1.2`. Keep the measured text bounds unchanged and increase
`innerEdge` from `0.45` to `0.55`. This creates a larger fully off-white center
without turning the surrounding transition into a broad flat field.

## Parameter changes

The following `QUIET_APERTURE` values change in
`src/lib/openboa/quiet-aperture.ts`:

| Parameter | Current | Approved |
| --- | ---: | ---: |
| `innerEdge` | `0.45` | `0.55` |
| `featherXMin` | `44` | `52.8` |
| `featherXMax` | `136` | `163.2` |
| `featherXViewportRatio` | `0.10625` | `0.1275` |
| `featherYMin` | `58` | `69.6` |
| `featherYMax` | `92` | `110.4` |
| `featherYViewportRatio` | `0.071875` | `0.08625` |

Scaling the minimum, maximum, and viewport ratio together keeps the increase at
20% across every responsive clamp state.

## Preserved behavior

- `shapePower`, `motionFloor`, `colorMix`, scale colors, scale movement, and
  cursor interaction remain unchanged.
- Header, Products dropdown, footer, and social apertures remain unchanged.
- Title copy, typography, spacing, and layout remain unchanged.

## Verification

- Add a contract check that locks all six approved feather values and confirms
  the expanded `innerEdge` value of `0.55`.
- Run token, responsive, lint, type, and production-build checks.
- Inspect the centered title at the same browser viewport before and after the
  change, including the Products-open state.
- Confirm the browser reports no warning or error logs.

## Rollback

The pre-expansion implementation remains available at commit `eb5c5a4`. The
approved pre-token landing remains preserved on
`backup/landing-v33-20260823` at `8bfc4d2`.
