using backend.Models;

namespace backend.Data;

// The 20 main topics of the official A/L Combined Mathematics syllabus
// (11 Pure Mathematics + 9 Applied Mathematics), each described by its
// syllabus sub-topics. This is the single flat list PastPapers/Resources
// are tagged against — finer-grained than this belongs in SyllabusEntries
// (used for AI context), not here.
public static class MathTopicSeedData
{
    public static List<MathTopic> GetTopics() => new()
    {
        // — Pure Mathematics —
        new() { Name = "Basic Mathematics", Description = "Real Numbers, Functions, Inequalities, Indices & Logarithms, Angular Measurements" },
        new() { Name = "Polynomials", Description = "Polynomial Functions, Remainder Theorem, Factor Theorem, Polynomial Equations" },
        new() { Name = "Quadratic Functions & Equations", Description = "Quadratic Functions, Quadratic Equations, Roots of Quadratic Equations, Nature of Roots, Graphs of Quadratic Functions" },
        new() { Name = "Trigonometry", Description = "Trigonometric Ratios & Functions, Trigonometric Identities, Trigonometric Equations, Sine Rule, Cosine Rule, Inverse Trigonometric Functions" },
        new() { Name = "Calculus", Description = "Limits, Differentiation, Rules of Differentiation, Applications of Derivatives, Integration, Indefinite Integrals, Applications of Integration" },
        new() { Name = "Coordinate Geometry", Description = "Cartesian Coordinates, Straight Lines, Distance & Midpoint, Circles" },
        new() { Name = "Series", Description = "Sequences, Arithmetic Progressions (AP), Geometric Progressions (GP), Mathematical Induction, Infinite Series" },
        new() { Name = "Binomial Expansion", Description = "Binomial Theorem, General Term, Middle Terms, Applications of Binomial Expansion" },
        new() { Name = "Complex Numbers", Description = "Imaginary Numbers, Complex Numbers, Algebra of Complex Numbers, Argand Diagram, Modulus & Argument, Polar Form" },
        new() { Name = "Permutations & Combinations", Description = "Fundamental Principle of Counting, Permutations, Combinations, Applications of Permutations & Combinations" },
        new() { Name = "Matrices", Description = "Matrix Notation, Types of Matrices, Matrix Operations, Determinants, Inverse of a Matrix, Solving Simultaneous Equations using Matrices" },

        // — Applied Mathematics —
        new() { Name = "Vectors", Description = "Scalars & Vectors, Magnitude & Direction, Vector Addition & Subtraction, Scalar Multiplication, Unit Vectors, Parallel Vectors, Position Vectors, Resolution of Vectors, Scalar Product, Vector Product" },
        new() { Name = "Kinematics", Description = "Motion in a Straight Line, Displacement/Velocity/Acceleration, Equations of Motion, Motion Under Gravity, Variable Acceleration, Relative Motion, Projectiles" },
        new() { Name = "Dynamics", Description = "Newton's Laws of Motion, Force & Acceleration, Systems of Forces, Resolution of Forces, Equilibrium of Forces, Friction, Connected Particles, Jointed Rods, Frameworks, Impulse & Momentum, Collision" },
        new() { Name = "Centre of Mass", Description = "Centre of Mass of Particles, Centre of Mass of Systems, Position of Centre of Mass, Motion of Centre of Mass" },
        new() { Name = "Work, Power & Energy", Description = "Work Done by a Force, Kinetic Energy, Potential Energy, Conservation of Energy, Power" },
        new() { Name = "Circular Motion", Description = "Angular Motion, Angular Velocity, Centripetal Acceleration, Centripetal Force, Motion in a Vertical Circle" },
        new() { Name = "Simple Harmonic Motion (SHM)", Description = "Hooke's Law, Tension & Thrust in Springs, SHM in a Horizontal Line, SHM in a Vertical Line, SHM under Gravity" },
        new() { Name = "Probability", Description = "Random Experiments, Sample Space & Events, Types of Events, Union & Intersection of Events, Mutually Exclusive Events, Exhaustive Events, Equally Likely Events, Classical Probability, Frequency Approach to Probability, Axiomatic Probability, Conditional Probability, Multiplication Rule, Independent Events, Partition of Sample Space, Total Probability Theorem, Bayes' Theorem" },
        new() { Name = "Statistics", Description = "Data & Statistical Methods, Mean/Median/Mode, Frequency Distributions, Grouped & Ungrouped Data, Weighted Mean, Quartiles & Percentiles, Box Plots, Measures of Dispersion, Range, Interquartile Range, Mean Deviation, Variance, Standard Deviation, Pooled Mean & Variance, Z-Score, Skewness, Karl Pearson's Measure of Skewness" },
    };
}
