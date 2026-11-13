export function family(module, topic, sourceKey, sourceReference, ask, options, cases) {
  return { module, topic, sourceKey, sourceReference, ask, options, cases };
}

export function calculation(module, topic, sourceKey, sourceReference, build, inputs) {
  return { module, topic, sourceKey, sourceReference, build, inputs, isCalc: true };
}

export function numeric(question, value, unit, formula, substitution, alternatives, decimals = 1) {
  const fmt = number => `${Number(number.toFixed(decimals))} ${unit}`;
  const options = [value, ...alternatives].map(fmt);
  if (new Set(options).size !== 4) throw new Error(`Non-distinct numeric options: ${question}`);
  return {
    question,
    options,
    answer: 0,
    explanation: `${formula} ${substitution} The result is ${fmt(value)}.`,
    steps: [
      { l: "Formula", c: formula },
      { l: "Substitution", c: substitution },
      { l: "Result", c: fmt(value) },
    ],
  };
}

