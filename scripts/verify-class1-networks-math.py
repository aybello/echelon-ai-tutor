"""Independent arithmetic verification; standard library only, no DB or network."""
import ast
import json
import math
import operator
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'content/class1-networks'
OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
       ast.Div: operator.truediv, ast.Pow: operator.pow}

def arithmetic(node):
    if isinstance(node, ast.Expression):
        return arithmetic(node.body)
    if isinstance(node, ast.Constant) and type(node.value) in (int, float):
        return node.value
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
        return arithmetic(node.operand) * (-1 if isinstance(node.op, ast.USub) else 1)
    if isinstance(node, ast.BinOp) and type(node.op) in OPS:
        return OPS[type(node.op)](arithmetic(node.left), arithmetic(node.right))
    raise ValueError('Non-arithmetic expression')

# Independently specified rounded results, in source-row order. These are not
# generated from the answer key or copied from the JavaScript evaluator at run time.
EXPECTED = {
    'distribution': [4147,33.33,.049,1.20,112,18.85,20,25,38,313.9,25,117.7,190,.50,43,
                     756,314.2,52,4,15,2,20,100,29,42,7.36,12,64,99,.250,42,.80,7.50,
                     27,120,80,.4,70,1.04,70,6,34.56,8.40,675,430,-4,40,2,70,5],
    'collection': [3024,4450,900,2.50,18,.50,103.72,3.7,78,.60,17.67,20,.125,1.05,
                   9.60,13.33,70,20,5,10,40,31.42,1.25,25.13,50,23,7.06,15,60,120,
                   .200,2.70,30,80,4.5,432,160,140,15,594,9,16.2,25.2,75,5,30,3.75,288,4,5],
}

for name, expected in EXPECTED.items():
    bank = json.loads((ROOT / f'questions/{name}-250.json').read_text())
    calculations = [q for q in bank if q['isCalc'] == 'yes']
    source_rows = (ROOT / f'source/{name}-calculations.txt').read_text().splitlines()
    assert len(calculations) == len(source_rows) == len(expected) == 50
    for q, row, target in zip(calculations, source_rows, expected):
        fields = row.split('|')
        assert len(fields) == 7
        module, stem, formula, expression, unit, decimals, distractors = fields
        places = int(decimals)
        calculated = arithmetic(ast.parse(expression, mode='eval'))
        assert math.isfinite(calculated)
        answer = f'{calculated:.{places}f} {unit}'
        assert answer == f'{target:.{places}f} {unit}', (name, q['questionNum'], answer, target)
        assert q['question'] == stem and q['module'] == module and q['formula'] == formula
        assert q['correctAnswer'] == answer == q['options'][q['correctIndex']]
        assert q['calculationExpression'] == expression
        assert q['decimalPlaces'] == places and q['unit'] == unit
        values = [float(option.removesuffix(f' {unit}')) for option in q['options']]
        assert len(set(values)) == 4, (name, q['questionNum'], 'numeric option collision')
        assert json.loads(q['steps'])[-1]['c'] == answer
    print(f'{name}: 50 independently checked calculation results and unique numeric choices passed')
