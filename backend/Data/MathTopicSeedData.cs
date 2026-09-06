using backend.Models;

namespace backend.Data;

// The 18 main topics of the official A/L Combined Mathematics syllabus
// (11 Pure Mathematics + 7 Applied Mathematics), each described by its
// syllabus sub-topics. This is the single flat list PastPapers/Resources
// are tagged against — finer-grained than this belongs in SyllabusEntries
// (used for AI context), not here. Icon is an emoji shown on the student
// Topics roadmap — purely decorative, safe to change without a migration.
public static class MathTopicSeedData
{
    public static List<MathTopic> GetTopics() => new()
    {
        // — Pure Mathematics —
        new() { Name = "Basic Mathematics", Branch = "Pure", Icon = "🧮", Description = "Expansion, Factorization, Indices, Equations, Logarithm, Partial Fractions, Inequalities, Modulus Inequality" },
        new() { Name = "Trigonometry", Branch = "Pure", Icon = "📐", Description = "Trigonometry Basics, Trigonometric Equations, General Solution, Inverse Functions, Properties of Triangles" },
        new() { Name = "Polynomials", Branch = "Pure", Icon = "📜", Description = "Remainder Theorem, Factor Theorem" },
        new() { Name = "Quadratic Equations and Functions", Branch = "Pure", Icon = "🥣", Description = "Quadratic equations and functions" },
        new() { Name = "Calculus", Branch = "Pure", Icon = "♾️", Description = "Limits, Differentiation, Application of Differentiation, Integration, Application of Integration" },
        new() { Name = "Coordinate Geometry", Branch = "Pure", Icon = "🗺️", Description = "Straight Line, Circle" },
        new() { Name = "Series", Branch = "Pure", Icon = "🔗", Description = "Mathematical Induction, Finite and Infinite Series" },
        new() { Name = "Binomial Expansion", Branch = "Pure", Icon = "🎲", Description = "Binomial expansion" },
        new() { Name = "Complex Numbers", Branch = "Pure", Icon = "🔮", Description = "Complex numbers" },
        new() { Name = "Permutation and Combination", Branch = "Pure", Icon = "🔀", Description = "Permutation and combination" },
        new() { Name = "Matrices", Branch = "Pure", Icon = "🧩", Description = "Matrices" },

        // — Applied Mathematics —
        new() { Name = "Vectors", Branch = "Applied", Icon = "🧭", Description = "Vectors" },
        new() { Name = "Kinematics", Branch = "Applied", Icon = "🏃", Description = "VT graph, Projectile Motion, Circular Motion, Simple Harmonic Motion" },
        new() { Name = "Dynamics", Branch = "Applied", Icon = "🏋️", Description = "Newton's Law of Motion, System of Forces, Resolution of Forces, Equilibrium of Forces, Friction, Jointed Rods, Frameworks, Impulse" },
        new() { Name = "Centre of Mass", Branch = "Applied", Icon = "⚖️", Description = "Centre of mass" },
        new() { Name = "Work, Power & Energy", Branch = "Applied", Icon = "⚡", Description = "Work, power and energy" },
        new() { Name = "Probability", Branch = "Applied", Icon = "🎯", Description = "Probability" },
        new() { Name = "Statistics", Branch = "Applied", Icon = "📊", Description = "Statistics" },
    };
}
