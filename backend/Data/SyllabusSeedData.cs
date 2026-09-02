using backend.Models;

namespace backend.Data;

// Distilled from the official NIE "Combined Mathematics Grade 12 and 13" syllabus
// (effective from 2017), https://www.nie.lk/pdffiles/tg/eAL_Syl%20ComMaths.pdf
public static class SyllabusSeedData
{
    public static List<SyllabusEntry> GetEntries() => new()
    {
        new() { Topic = "Real Numbers", Paper = "Combined Maths I", Keywords = "real numbers, surds, decimals, rational, irrational",
            Content = "Classification of real numbers, geometrical representation on the number line, decimal representation, simplification of expressions involving surds." },

        new() { Topic = "Functions", Paper = "Combined Maths I", Keywords = "functions, domain, range, one-one, onto, inverse function, composite function",
            Content = "Intuitive idea of a function, domain/codomain/range, one-one and onto functions, inverse functions, types of functions (constant, linear, piecewise, modulus), graphs, composite functions." },

        new() { Topic = "Quadratic Functions and Equations", Paper = "Combined Maths I", Keywords = "quadratic, discriminant, roots, completing the square",
            Content = "Properties of quadratic functions, completing the square, discriminant, greatest/least value, sum and product of roots, nature of roots, common roots of two quadratics." },

        new() { Topic = "Polynomials", Paper = "Combined Maths I", Keywords = "polynomial, remainder theorem, factor theorem, synthetic division",
            Content = "Polynomial operations, division algorithm, synthetic division, remainder theorem, factor theorem and its converse, solving polynomial equations up to order 4." },

        new() { Topic = "Rational Functions (Partial Fractions)", Paper = "Combined Maths I", Keywords = "partial fractions, rational function, proper improper",
            Content = "Resolving proper and improper rational functions into partial fractions, distinct linear factors, recurring linear factors, quadratic factors in the denominator, up to 4 unknowns." },

        new() { Topic = "Indices and Logarithms", Paper = "Combined Maths I", Keywords = "index laws, logarithm, log, change of base",
            Content = "Index laws, logarithmic laws, change of base formula." },

        new() { Topic = "Inequalities", Paper = "Combined Maths I", Keywords = "inequality, modulus, absolute value, interval",
            Content = "Basic properties of inequalities including trichotomy law, linear/quadratic/rational inequalities solved algebraically and graphically, inequalities involving the modulus function, linear only." },

        new() { Topic = "Angular Measure", Paper = "Combined Maths I", Keywords = "radian, degree, arc length, sector area",
            Content = "Relationship between radians and degrees, arc length S = r*theta, area of a circular sector A = half r squared theta." },

        new() { Topic = "Circular (Trigonometric) Functions", Paper = "Combined Maths I", Keywords = "trigonometric functions, sin, cos, tan, circular functions, graphs",
            Content = "Definitions of the six basic trigonometric functions, domain and range, values at standard angles, periodic properties, graphs, general solutions of sin theta = sin alpha etc." },

        new() { Topic = "Trigonometric Identities", Paper = "Combined Maths I", Keywords = "trig identities, sum difference formula, double angle, half angle, product to sum",
            Content = "Pythagorean identities, sum and difference formulae, product-sum and sum-product formulae, double/triple/half angle formulae, solving a cos theta + b sin theta = c type equations." },

        new() { Topic = "Sine Rule and Cosine Rule", Paper = "Combined Maths I", Keywords = "sine rule, cosine rule, triangle",
            Content = "Statement and proof of sine rule and cosine rule for any triangle, and problems applying them." },

        new() { Topic = "Inverse Trigonometric Functions", Paper = "Combined Maths I", Keywords = "inverse trig, arcsin, arccos, arctan, principal value",
            Content = "Definitions and principal values of inverse trigonometric functions, their graphs, and problems involving them." },

        new() { Topic = "Limits", Paper = "Combined Maths I", Keywords = "limit, continuity, asymptote, sandwich theorem",
            Content = "Intuitive idea and basic theorems on limits, the standard results lim (x^n - a^n)/(x - a) = n a^(n-1) and lim sin(x)/x = 1 as x tends to 0, both proved from first principles and the sandwich theorem, NOT via L'Hopital's Rule. One-sided limits, limits at infinity, infinite limits, horizontal/vertical asymptotes, continuity at a point. L'Hopital's Rule, Taylor series, and other university-level limit techniques are explicitly outside this syllabus." },

        new() { Topic = "Differentiation", Paper = "Combined Maths I", Keywords = "derivative, differentiate, first principles, product rule, quotient rule, chain rule, implicit, parametric",
            Content = "Derivative as slope/limit/rate of change, derivatives from first principles, theorems on differentiation (constant multiple, sum, product, quotient, chain rule), derivatives of inverse trig functions, natural exponential and logarithmic functions, implicit and parametric differentiation, higher order derivatives." },

        new() { Topic = "Applications of Derivatives", Paper = "Combined Maths I", Keywords = "stationary points, maxima minima, concavity, curve sketching, optimization",
            Content = "Stationary points, increasing/decreasing functions, local maxima/minima via first and second derivative tests, points of inflection, concavity, curve sketching including asymptotes, optimization problems." },

        new() { Topic = "Integration", Paper = "Combined Maths I", Keywords = "integral, integration, antiderivative, definite integral, area under curve, volume of revolution, integration by parts, substitution",
            Content = "Integration as reverse of differentiation, fundamental theorem of calculus, definite integrals, integrating rational functions via partial fractions, integrating trig expressions via identities, integration by substitution, integration by parts, area under/between curves, volume of revolution using pi times integral of y squared dx." },

        new() { Topic = "Straight Line (Coordinate Geometry)", Paper = "Combined Maths I", Keywords = "straight line, gradient, coordinate geometry, cartesian",
            Content = "Distance between two points, section formula internal/external, forms of the equation of a straight line, point of intersection, angle between lines, condition for parallel/perpendicular lines, perpendicular distance from a point to a line, angle bisectors." },

        new() { Topic = "Mathematical Induction", Paper = "Combined Maths I", Keywords = "induction, proof, mathematical induction",
            Content = "Principle of Mathematical Induction and its use for proving divisibility, summation, and inequality results." },

        new() { Topic = "Series and Sequences", Paper = "Combined Maths I", Keywords = "series, sequence, arithmetic progression, geometric progression, sigma notation, sum to infinity, convergence",
            Content = "Sigma notation, arithmetic and geometric series, standard summation formulae for sum of r, r squared, r cubed, method of differences, method of partial fractions for summation, sequences, partial sums, convergence and divergence, sum to infinity." },

        new() { Topic = "Binomial Expansion", Paper = "Combined Maths I", Keywords = "binomial theorem, binomial expansion, binomial coefficient",
            Content = "Binomial theorem for positive integral indices, general term, binomial coefficients, relationships among coefficients, finding specific terms." },

        new() { Topic = "Complex Numbers", Paper = "Combined Maths I", Keywords = "complex number, imaginary, argand diagram, modulus, argument, de moivre",
            Content = "Algebraic operations on complex numbers, complex conjugate properties, modulus, Argand diagram, polar form, argument/principal argument, triangle inequality, De Moivre's theorem, locus of a variable complex number." },

        new() { Topic = "Permutations and Combinations", Paper = "Combined Maths I", Keywords = "permutation, combination, factorial, arrangement",
            Content = "Factorial notation, fundamental principle of counting, permutations nPr, permutations with repeated objects, cyclic permutations, combinations nCr." },

        new() { Topic = "Matrices", Paper = "Combined Maths I", Keywords = "matrix, matrices, determinant, inverse matrix",
            Content = "Matrix definitions and notation, equality, scalar multiplication, addition/subtraction, matrix multiplication, special square matrices, transpose, inverse of a 2x2 matrix only, solving simultaneous equations with two variables using matrices." },

        new() { Topic = "Circle (Coordinate Geometry)", Paper = "Combined Maths I", Keywords = "circle equation, tangent to circle, coordinate geometry circle",
            Content = "Equation of a circle (centre-radius and general form), position of a line relative to a circle, equations of tangents from a point, length of tangent, chord of contact, position of two circles, condition for orthogonal intersection." },

        new() { Topic = "Vectors", Paper = "Combined Maths II", Keywords = "vector, position vector, scalar product, dot product, vector product",
            Content = "Vector notation and algebra, triangle law of addition, position vectors, resolving vectors, scalar (dot) product and its properties, vector (cross) product definition and properties. Application of vector product is not expected at A/L level." },

        new() { Topic = "Coplanar Forces at a Point", Paper = "Combined Maths II", Keywords = "coplanar forces, resultant force, equilibrium, lami's theorem, triangle of forces",
            Content = "Forces acting on a particle, resultant of two/more forces, parallelogram law, resolution of forces, equilibrium of a particle under two or three forces, triangle law of forces, Lami's theorem." },

        new() { Topic = "Coplanar Forces on a Rigid Body", Paper = "Combined Maths II", Keywords = "moment of a force, couple, rigid body, jointed rods, framework, friction",
            Content = "Moment of a force about a point, resultant of parallel forces, couples, reducing a system of coplanar forces to a single force and a couple, equilibrium of three coplanar forces on a rigid body, friction, limiting friction, coefficient/angle of friction, smoothly jointed rods and frameworks using Bow's notation." },

        new() { Topic = "Centre of Mass", Paper = "Combined Maths II", Keywords = "centre of mass, centre of gravity, centroid",
            Content = "Centre of mass of symmetrical uniform bodies (rods, laminas, rings, discs, cylinders, spheres), using integration for arcs/sectors/cones/hemispheres, centre of mass of composite and remaining bodies, stability of equilibrium." },

        new() { Topic = "Motion in a Straight Line", Paper = "Combined Maths II", Keywords = "kinematics, velocity, acceleration, displacement time graph, relative motion straight line",
            Content = "Distance, speed, displacement, velocity, acceleration, displacement-time and velocity-time graphs, kinematic equations for constant acceleration, vertical motion under gravity, relative motion of two bodies along a straight line." },

        new() { Topic = "Motion in a Plane and Projectiles", Paper = "Combined Maths II", Keywords = "projectile motion, relative motion plane, position vector motion",
            Content = "Position vector, velocity and acceleration of a particle moving on a plane, relative motion of two particles on a plane, projectile motion, equations of the path, maximum height, time of flight, horizontal range, and the two angles of projection giving the same range." },

        new() { Topic = "Newton's Laws of Motion", Paper = "Combined Maths II", Keywords = "newton's laws, force, mass, momentum, F=ma",
            Content = "Newton's first, second (F = ma), and third laws of motion, linear momentum, absolute and gravitational units of force, mass vs weight, bodies in contact and connected by strings, systems of pulleys, up to 4." },

        new() { Topic = "Work, Power, and Energy", Paper = "Combined Maths II", Keywords = "work done, power, kinetic energy, potential energy, conservation of energy",
            Content = "Work done by a constant force, kinetic energy, potential energy (gravitational and elastic), conservative and dissipative forces, work-energy equations, conservation of mechanical energy, definition and use of power P = F.v." },

        new() { Topic = "Impulse and Collision", Paper = "Combined Maths II", Keywords = "impulse, collision, momentum conservation, coefficient of restitution, elastic collision",
            Content = "Impulse as change in momentum, loss of kinetic energy due to impulsive action, Newton's law of restitution and coefficient of restitution, direct impact of smooth elastic spheres, conservation of linear momentum." },

        new() { Topic = "Circular Motion", Paper = "Combined Maths II", Keywords = "circular motion, angular velocity, conical pendulum, vertical circle",
            Content = "Angular velocity and acceleration, velocity/acceleration of a particle moving on a circle, motion in a horizontal circle, conical pendulum, motion on a vertical circle (string, tube, sphere) using energy conservation." },

        new() { Topic = "Simple Harmonic Motion", Paper = "Combined Maths II", Keywords = "SHM, simple harmonic motion, amplitude, period",
            Content = "Definition and characteristic differential equation of SHM, velocity as a function of displacement, amplitude and period, SHM under elastic forces (Hooke's law) on horizontal and vertical lines, combination of SHM with free motion under gravity." },

        new() { Topic = "Probability", Paper = "Combined Maths II", Keywords = "probability, conditional probability, bayes theorem, independent events",
            Content = "Random experiments, sample space, events, classical/axiomatic definitions of probability, addition rule, conditional probability, multiplication rule, independence of two/three events, partition of sample space, theorem of total probability, Bayes' theorem." },

        new() { Topic = "Statistics", Paper = "Combined Maths II", Keywords = "statistics, mean, median, mode, standard deviation, variance, skewness",
            Content = "Measures of central tendency (mean, mode, median) for grouped/ungrouped data, quartiles and percentiles, measures of dispersion (range, IQR, mean deviation, variance, standard deviation), pooled mean/variance, z-score, measures of skewness (Karl Pearson's)." },
    };
}