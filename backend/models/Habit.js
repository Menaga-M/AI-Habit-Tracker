import mongoose from "mongoose";
export const CATEGORIES = [
  "Health",
  "Fitness",
  "Learning",
  "Mindfulness",
  "Productivity",
  "Social",
  "Finance",
  "Creative",
  "Other",
];

const habitSchema = new mongoose.Schema(
    {
        userId : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        name: { type: String, required: true, trim: true},
        description: { type: String, default: "", trim: true},
        category: { 
            type: String, 
            enum: CATEGORIES, 
            default: "Other" 
        },
        frequency: {
            type: String,
            enum: ["daily", "weekly"],
            default: "daily",
        },
        targetDays: { type: Number, default: 7, min: 1, max: 7},
        color: { type: String, default: "#6366f1"},
        icon: { type: String, default: "🎯"},
        _streakProb: { type: Number, min: 0, max: 1 },
        _pattern: { type: String, trim: true },
        // Days ago on which the seeded streak is intentionally broken.
        _brokeAt: { type: Number, min: 0 },
        isArchived: { type: Boolean, default: false },
        order: { type: Number, default: 0},
    },
    { timestamps: true}
); 

export const HABIT_CATEGORIES = CATEGORIES;
export default mongoose.model("Habit", habitSchema);
