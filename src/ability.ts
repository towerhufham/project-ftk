//composable ability shorthands
//once this gets to a comfortable place, can remove "extraneous" things like sendTo from Ability definition

import type { Ability, AbilityContext, StateChange, Zone } from "./game"

export const moveTargetsToZone = (to: Zone): ((ctx: AbilityContext) => StateChange[]) => {
  return (ctx) => {
    return ctx.targets.map(c => { return {type: "Move Card", iid: c.iid, toZone: to}}) as StateChange[]
  }
}