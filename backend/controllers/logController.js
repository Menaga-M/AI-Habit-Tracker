import HabitLog from "../models/HabitLog.js";
import Habit from "../models/Habit.js";
import {
    todayKey,
    last90Days,
    lastNDays,
    calcStreak,
} from "../utils/dateHelpers.js";

export const markComplete = async (req, res) => {
    try{
        const { habitId, date} = req.body;
        const completedDate = date || todayKey();
        const habit = await Habit.findOne({
            _id: habitId,
            userId: req.user._id,
        });
        if(!habit) return res.status(404).json({message: "Habit not found"});
        
        const log = await HabitLog.findOneAndUpdate(
            { userId: req.user._id, habitId, completedDate},
            {$setOnInsert: { userId: req.user._id, habitId, completedDate}},
            {upsert: true, new: true}
        );
        res.status(201).json(log);
    }catch(err){
        res.status(500).json({message: err.message});
    }
};