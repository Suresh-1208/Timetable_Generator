import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // Import the CSS file

function App() {
    const [numClasses, setNumClasses] = useState('');
    const [numDays, setNumDays] = useState('');
    const [periodsPerDay, setPeriodsPerDay] = useState('');
    const [numStaff, setNumStaff] = useState('');
    const [staffData, setStaffData] = useState([]);
    const [breakPeriods, setBreakPeriods] = useState('');
    const [timetable, setTimetable] = useState(null);
    const [error, setError] = useState('');

    // Update the number of staff and generate empty fields accordingly
    const handleNumStaffChange = (e) => {
        const staffCount = parseInt(e.target.value, 10);
        setNumStaff(staffCount);

        // Create an empty array of staff data with the correct length
        const initialStaffData = Array.from({ length: staffCount }, () => ({
            name: '',
            subjects: ''
        }));
        setStaffData(initialStaffData);
    };

    // Update individual staff name and subject based on the index and field
    const handleStaffChange = (index, field, value) => {
        const updatedStaffData = [...staffData];
        updatedStaffData[index][field] = value;
        setStaffData(updatedStaffData);
    };

    // Submit form data to the Flask backend
    const handleSubmit = async (e) => {
        e.preventDefault();

        const classes = Array.from({ length: numClasses }, (_, i) => `Class_${i + 1}`);
        const slots = Array.from({ length: numDays * periodsPerDay }, (_, i) => `Day_${Math.floor(i / periodsPerDay) + 1}_Period_${(i % periodsPerDay) + 1}`);
        const staffSubjects = {};

        // Map staff names to their subjects
        staffData.forEach((staff) => {
            staffSubjects[staff.name] = staff.subjects.split(',').map(sub => sub.trim());
        });

        const payload = {
            classes,
            slots,
            staff: staffData.map(staff => staff.name),
            staff_subjects: staffSubjects,
            break_periods: breakPeriods.split(',').map(bp => bp.trim()),
        };

        try {
            const response = await axios.post('http://127.0.0.1:5000/generate-timetable', payload);
            setTimetable(response.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred while generating the timetable.');
            setTimetable(null);
        }
    };

    // Reset the form and timetable
    const handleReset = () => {
        setNumClasses('');
        setNumDays('');
        setPeriodsPerDay('');
        setNumStaff('');
        setStaffData([]);
        setBreakPeriods('');
        setTimetable(null);
        setError('');
    };

    return (
        <div>
            <h1>Timetable Generator</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Number of Classes:
                    <input type="number" value={numClasses} onChange={e => setNumClasses(e.target.value)} required />
                </label>
                <br />
                <label>
                    Number of Days in the Week:
                    <input type="number" value={numDays} onChange={e => setNumDays(e.target.value)} required />
                </label>
                <br />
                <label>
                    Number of Periods per Day:
                    <input type="number" value={periodsPerDay} onChange={e => setPeriodsPerDay(e.target.value)} required />
                </label>
                <br />
                <label>
                    Number of Staff:
                    <input type="number" value={numStaff} onChange={handleNumStaffChange} required />
                </label>
                <br />
                {staffData.map((_, index) => (
                    <div key={index}>
                        <h3>Staff {index + 1}</h3>
                        <label>
                            Staff Name:
                            <input
                                type="text"
                                value={staffData[index]?.name || ''}
                                onChange={e => handleStaffChange(index, 'name', e.target.value)}
                                required
                            />
                        </label>
                        <br />
                        <label>
                            Subjects (comma-separated):
                            <input
                                type="text"
                                value={staffData[index]?.subjects || ''}
                                onChange={e => handleStaffChange(index, 'subjects', e.target.value)}
                                required
                            />
                        </label>
                        <br />
                    </div>
                ))}
                <label>
                    Break Periods (comma-separated, e.g., Day_1_Period_3,Day_2_Period_4):
                    <input type="text" value={breakPeriods} onChange={e => setBreakPeriods(e.target.value)} required />
                </label>
                <br />
                <button type="submit">Generate Timetable</button>
                <button type="button" onClick={handleReset}>Reset</button>
            </form>

            {error && <p className="error">{error}</p>}

            {timetable && (
                <div>
                    <h2>Generated Timetable:</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th>Staff</th>
                                <th>Subject</th>
                                <th>Slot</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timetable.map((entry, index) => (
                                <tr key={index}>
                                    <td>{entry.Class}</td>
                                    <td>{entry.Staff}</td>
                                    <td>{entry.Subject}</td>
                                    <td>{entry.Slot}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default App;
