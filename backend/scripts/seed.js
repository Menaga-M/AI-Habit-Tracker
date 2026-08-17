import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
import "dotenv/config";
import mongoose from "mongoose";
import { format, subDays } from "date-fns";
import User from "../models/User.js";
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";
import AIInsight from "../models/AIInsight.js";

const demoEmail = "demo@habittracker.app";

const isEligibleDay = (habit, date) => {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (habit.frequency === "weekly") return dayOfWeek === 0;
  if (habit._pattern === "weekdays") return !isWeekend;
  if (habit._pattern === "weekends") return isWeekend;
  return true;
};

// Produces repeatable data without Math.random(), so re-seeding gives the
// same completion pattern for the same habit and total number of days.
const completionChance = (habitId, daysAgo) => {
  const idValue = String(habitId)
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return ((idValue * 31 + daysAgo * 17) % 100) / 100;
};

const buildLogs = (habit, userId, totalDays = 90) => {
  const logs = [];
  const streakProbability = habit._streakProb ?? 0.7;

  for (let daysAgo = 0; daysAgo < totalDays; daysAgo += 1) {
    const date = subDays(new Date(), daysAgo);

    if (!isEligibleDay(habit, date)) continue;
    if (habit._brokeAt === daysAgo) continue;
    if (completionChance(habit._id, daysAgo) >= streakProbability) continue;

    logs.push({
      userId,
      habitId: habit._id,
      completedDate: format(date, "yyyy-MM-dd"),
    });
  }

  return logs;
};

const connect = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not defined");
  await mongoose.connect(process.env.MONGO_URI);
};

const run = async () => {
  await connect();

  const previousUser = await User.findOne({ email: demoEmail }).select("_id");
  if (previousUser) {
    await AIInsight.deleteMany({ userId: previousUser._id });
    await HabitLog.deleteMany({ userId: previousUser._id });
    await Habit.deleteMany({ userId: previousUser._id });
    await User.deleteOne({ _id: previousUser._id });
  }

  const user = await User.create({
    name: "Alex Morgan",
    email: demoEmail,
    password: "demo1234",
    avatar: "A",
    morningMotivation: true,
  });

  const habits = await Habit.insertMany([
    {
      userId: user._id,
      name: "Morning walk",
      description: "Walk outside for at least 20 minutes.",
      category: "Fitness",
      frequency: "daily",
      targetDays: 6,
      color: "#f97316",
      _streakProb: 0.82,
      _pattern: "weekdays",
      _brokeAt: 14,
      icon: "🚶",
      order: 0,
    },
    {
      userId: user._id,
      name: "Drink 2L water",
      description: "Finish two litres of water through the day.",
      category: "Health",
      frequency: "daily",
      targetDays: 7,
      color: "#06b6d4",
      _streakProb: 0.93,
      icon: "💧",
      order: 1,
    },
    {
      userId: user._id,
      name: "Read for 20 minutes",
      description: "Read a book, article, or course material.",
      category: "Learning",
      frequency: "daily",
      targetDays: 5,
      color: "#8b5cf6",
      _pattern: "weekdays",
      _brokeAt: 28,
      icon: "📚",
      order: 2,
    },
    {
      userId: user._id,
      name: "Meditate",
      description: "Take ten quiet minutes to reset.",
      category: "Mindfulness",
      frequency: "daily",
      targetDays: 5,
      color: "#ec4899",
      icon: "🧘",
      order: 3,
    },
    {
      userId: user._id,
      name: "Plan the week",
      description: "Review priorities and schedule the week ahead.",
      category: "Productivity",
      frequency: "weekly",
      targetDays: 1,
      color: "#22c55e",
      icon: "🗓️",
      order: 4,
    },
  ]);

  const meditation = habits.find((habit) => habit.name === "Meditate");
  const logs = habits.flatMap((habit) => buildLogs(habit, user._id, 90));

  await HabitLog.insertMany(logs);

  await AIInsight.insertMany([
    {
      userId: user._id,
      type: "morning",
      content:
        "Good morning, Alex. Your water habit is already one of your strongest—keep that momentum going today. A short morning walk is all you need to make this a great start. ☀️",
      meta: { source: "seed" },
    },
    {
      userId: user._id,
      type: "weekly",
      content:
        "You built a strong foundation this week. Drink 2L water stayed remarkably consistent, and your reading habit is becoming easier to return to. Morning walks were strongest on weekdays, so try a shorter weekend version to protect the rhythm. Your next small win: put your walking shoes by the door tonight.",
      meta: { period: "last-7-days", source: "seed" },
    },
    {
      userId: user._id,
      type: "recovery",
      content:
        "Missing a meditation day does not undo your progress.\n\nDay 1: Sit quietly for two minutes.\nDay 2: Use a five-minute guided session.\nDay 3: Return to your usual ten-minute practice.\n\nKeep the restart tiny—the habit is still yours.",
      meta: { habitId: meditation._id, source: "seed" },
    },
    {
      userId: user._id,
      type: "suggestion",
      content: JSON.stringify([
        {
          name: "Prepare tomorrow's water bottle",
          description: "Fill a bottle before bed and keep it visible in the morning.",
          frequency: "daily",
          category: "Health",
          icon: "💧",
          reason: "It makes your already-strong hydration habit effortless to start.",
        },
        {
          name: "Five-minute weekend walk",
          description: "Take a deliberately short walk on Saturday or Sunday.",
          frequency: "weekly",
          category: "Fitness",
          icon: "🚶",
          reason: "A smaller weekend version can protect your walking rhythm.",
        },
        {
          name: "Read one page before bed",
          description: "Open your book and read just one page on busy nights.",
          frequency: "daily",
          category: "Learning",
          icon: "📖",
          reason: "The smallest possible reading session keeps the habit alive.",
        },
      ]),
      meta: { goals: "Consistency and energy", source: "seed" },
    },
    {
      userId: user._id,
      type: "chat",
      content:
        "Your most consistent habit is Drink 2L water. Morning walk is strong during the week but drops on weekends, while meditation has a steadier every-other-day pattern. Try making the weekend walk shorter instead of skipping it entirely.",
      meta: {
        question: "What patterns do you notice in my habits?",
        source: "seed",
      },
    },
  ]);

  console.log(
    `Seeded ${user.name} with ${habits.length} habits, ${logs.length} completions, and 5 AI insights.`
  );
  console.log(`Sign in with ${demoEmail} / demo1234`);
};

run()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
