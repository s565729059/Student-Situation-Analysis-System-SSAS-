const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    grade: {
        type: String,
        required: true
    },
    examCount: {
        type: Number,
        required: true
    },
    hobbies: {
        type: String
    },
    studyHabits: {
        type: String
    },
    otherInfo: {
        type: String
    },
    grades: {
        type: Array,
        required: true
    },
    analysisResult: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Student', studentSchema);
