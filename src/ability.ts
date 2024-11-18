//composable ability shorthands
//once this gets to a comfortable place, can remove "extraneous" things like sendTo from Ability definition

import type { AbilityContext, StateChange, Zone } from "./game"

type StateChangeGenerator = (ctx: AbilityContext) => StateChange[]

export const moveTargetsToZone = (to: Zone): StateChangeGenerator => {
  return (ctx: AbilityContext) => {
    return ctx.targets.map(c => { return {type: "Move Card", iid: c.iid, toZone: to}})
  }
}