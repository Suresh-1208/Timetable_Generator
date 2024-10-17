from flask import Flask, request, jsonify
from flask_cors import CORS
from ortools.sat.python import cp_model
import random
import pandas as pd

app = Flask(__name__)

CORS(app)

@app.route('/generate-timetable', methods=['POST'])
def generate_timetable():
    data = request.json
    classes = data.get('classes')
    slots = data.get('slots')
    staff = data.get('staff')
    staff_subjects = data.get('staff_subjects')
    break_periods = data.get('break_periods')

    model = cp_model.CpModel()
    schedule = {}

   
    for s in staff:
        random.shuffle(staff_subjects[s])

    for c in classes:
        for s in staff:
            for sub in staff_subjects[s]:
                for sl in slots:
                    if sl not in break_periods:
                        schedule[(c, s, sub, sl)] = model.NewBoolVar(f'{c}_{s}_{sub}_{sl}')


    for c in classes:
        for sl in slots:
            if sl not in break_periods:
                model.AddExactlyOne(schedule[(c, s, sub, sl)] for s in staff for sub in staff_subjects[s])

    for s in staff:
        for sl in slots:
            if sl not in break_periods:
                model.AddAtMostOne(schedule[(c, s, sub, sl)] for c in classes for sub in staff_subjects[s])

    
    for c in classes:
        for s in staff:
            for sub in staff_subjects[s]:
                for i in range(len(slots) - 1):
                    if slots[i] not in break_periods and slots[i + 1] not in break_periods:
                        model.Add(schedule[(c, s, sub, slots[i])].Not() + schedule[(c, s, sub, slots[i + 1])].Not() >= 1)

    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    if status == cp_model.FEASIBLE or status == cp_model.OPTIMAL:
        schedule_output = []
        for c in classes:
            for s in staff:
                for sub in staff_subjects[s]:
                    for sl in slots:
                        if sl not in break_periods and solver.Value(schedule[(c, s, sub, sl)]) == 1:
                            schedule_output.append({'Class': c, 'Staff': s, 'Subject': sub, 'Slot': sl})

        return jsonify(schedule_output)
    else:
        return jsonify({"error": "No feasible solution found."}), 400

if __name__ == '__main__':
    app.run(debug=True)

