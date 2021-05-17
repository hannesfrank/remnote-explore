async function* walkDescendants(rem) {
  const children = await Promise.all(
    rem.children.map(async (childId) => await db.get("quanta", childId))
  );

  for (let child of children) {
    if (child && !child.rcrp) {
      yield child;
      yield* walkDescendants(child);
    }
  }
}
let limit = 10;

const descendants = [];
for await (let d of walkDescendants(el.remData)) {
  descendants.push(d);
}
const [done, total] = descendants.reduce(
  ([d, t], rem) => {
    if (rem.crt && rem.crt.t && rem.crt.t.s && rem.crt.t.s.s === "Unfinished") {
      return [d, t + 1];
    }
    if (rem.crt && rem.crt.t && rem.crt.t.s && rem.crt.t.s.s === "Finished") {
      return [d + 1, t + 1];
    }
    return [d, t];
  },
  [0, 0]
);
const progress = Math.round((done / total) * 100);
