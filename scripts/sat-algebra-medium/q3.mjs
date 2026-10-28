// Linear functions (27).
import { ce, cerr } from './q1.mjs';

const R = String.raw;
const S = 'Linear functions';
const IMG = (id) => `/hub/visuals/sat/${id}.png`;

export default [
  {
    id: 'e62cfe5f', skill: S, type: 'spr', accepted: ['2.6', '13/5'],
    prompt: 'According to a model, the head width, in millimeters, of a worker bumblebee can be estimated by adding 0.6 to four times the body weight of the bee, in grams. According to the model, what would be the head width, in millimeters, of a worker bumblebee that has a body weight of 0.5 grams?',
    explanation: R`The correct answer is 2.6. According to the model, the head width, in millimeters, of a worker bumblebee can be estimated by adding 0.6 to 4 times the body weight, in grams, of the bee. Let x represent the body weight, in grams, of a worker bumblebee and let y represent the head width, in millimeters. Translating the verbal description of the model into an equation yields \(y=0.6+4x\). Substituting 0.5 grams for x in this equation yields \(y=0.6+4(0.5)\), or \(y=2.6\). Therefore, a worker bumblebee with a body weight of 0.5 grams has an estimated head width of 2.6 millimeters. Note that 2.6 and 13/5 are examples of ways to enter a correct answer.`,
  },
  {
    id: '8b9960b2', skill: S, type: 'mcq', answer: 'C',
    prompt: R`The owner of a bakery is giving away free muffins every hour. The equation \(f(x)=108-9x\) gives the number of free muffins, \(f(x)\), that remain to be given away after \(x\) hours. Which of the following is the best interpretation of \(f(12)=0\) in this context?`,
    options: [
      R`The owner of the bakery has \(12\) free muffins to give away.`,
      R`The owner of the bakery will give away \(12\) free muffins in \(9\) hours.`,
      R`It will take \(12\) hours to give away all the free muffins.`,
      R`It will take \(108\) hours to give away \(12\) free muffins.`,
    ],
    explanation: R`Choice C is correct. It's given that the equation \(f(x)=108-9x\) represents the number of free muffins that remain to be given away after \(x\) hours. For the given equation \(f(12)=0\), when the value of \(x\) is \(12\), the value of \(f(x)\) is \(0\). It follows that after \(12\) hours there are \(0\) free muffins remaining to be given away. Therefore, based on this context, it will take \(12\) hours to give away all the free muffins.` + '\n\n' + ce('A', 'B') + '\n\n' + R`Choice D is incorrect. This represents giving away \(12\) muffins over \(108\) hours rather than giving away all \(108\) muffins in \(12\) hours.`,
  },
  {
    id: '7e3f8363', skill: S, type: 'mcq', answer: 'C',
    prompt: R`In the xy-plane, the graph of the linear function \(f\) contains the points \((0, 3)\) and \((7, 31)\). Which equation defines \(f\), where \(y=f(x)\)?`,
    options: [R`\(f(x)=28x+34\)`, R`\(f(x)=3x+38\)`, R`\(f(x)=4x+3\)`, R`\(f(x)=7x+3\)`],
    explanation: R`Choice C is correct. In the xy-plane, an equation of the graph of a linear function can be written in the form \(f(x)=mx+b\), where \(m\) represents the slope and \((0, b)\) represents the y-intercept of the graph of \(y=f(x)\). It's given that the graph of the linear function \(f\), where \(y=f(x)\), in the xy-plane contains the point \((0, 3)\). Thus, \(b=3\). The slope of the graph of a line containing any two points \((x_1, y_1)\) and \((x_2, y_2)\) can be found using the slope formula, \(m=\frac{y_2-y_1}{x_2-x_1}\). Since it's given that the graph of the linear function \(f\) contains the points \((0, 3)\) and \((7, 31)\), it follows that the slope of the graph of the line containing these points is \(m=\frac{31-3}{7-0}\), or \(m=4\). Substituting \(4\) for \(m\) and \(3\) for \(b\) in \(f(x)=mx+b\) yields \(f(x)=4x+3\).

Choice A is incorrect. This function represents a graph with a slope of \(28\) and a y-intercept of \((0, 34)\).

Choice B is incorrect. This function represents a graph with a slope of \(3\) and a y-intercept of \((0, 38)\).

Choice D is incorrect. This function represents a graph with a slope of \(7\) and a y-intercept of \((0, 3)\).`,
  },
  {
    id: '620fe971', skill: S, type: 'mcq', answer: 'A',
    prompt: R`A team of workers has been moving cargo off of a ship. The equation below models the approximate number of tons of cargo, y, that remains to be moved x hours after the team started working.
\[y=120-25x\]
The graph of this equation in the xy-plane is a line. What is the best interpretation of the x-intercept in this context?`,
    options: [
      'The team will have moved all the cargo in about 4.8 hours.',
      'The team has been moving about 4.8 tons of cargo per hour.',
      'The team has been moving about 25 tons of cargo per hour.',
      'The team started with 120 tons of cargo to move.',
    ],
    explanation: `Choice A is correct. The x-intercept of the line with equation y = 120 – 25x can be found by substituting 0 for y and finding the value of x. When y = 0, x = 4.8, so the x-intercept is at (4.8, 0). Since y represents the number of tons of cargo remaining to be moved x hours after the team started working, it follows that the x-intercept refers to the team having no cargo remaining to be moved after 4.8 hours. In other words, the team will have moved all of the cargo after about 4.8 hours.

Choice B is incorrect and may result from incorrectly interpreting the value 4.8. Choices C and D are incorrect and may result from misunderstanding the x-intercept. These statements are accurate but not directly relevant to the x-intercept.`,
  },
  {
    id: '58c7daed', skill: S, type: 'mcq', answer: 'A',
    prompt: R`For the linear function \(h\), \(h(0)=0\) and \(h(11)=10\). Which equation defines \(h\)?`,
    options: [R`\(h(x)=\frac{10}{11}x\)`, R`\(h(x)=\frac{10}{11}x+10\)`, R`\(h(x)=\frac{11}{10}x\)`, R`\(h(x)=\frac{11}{10}x+11\)`],
    explanation: R`Choice A is correct. Since \(h\) is a linear function, it can be defined by an equation of the form \(h(x)=mx+b\), where \(m\) and \(b\) are constants. It's given that \(h(0)=0\). Substituting \(0\) for \(x\) and \(0\) for \(h(x)\) in the equation \(h(x)=mx+b\) yields \(0=0m+b\), or \(0=b\). Substituting \(0\) for \(b\) in the equation \(h(x)=mx+b\) yields \(h(x)=mx\). It's also given that \(h(11)=10\). Substituting \(11\) for \(x\) and \(10\) for \(h(x)\) in the equation \(h(x)=mx\) yields \(10=11m\). Dividing both sides of this equation by \(11\) yields \(m=\frac{10}{11}\). Substituting \(\frac{10}{11}\) for \(m\) in the equation \(h(x)=mx\) yields \(h(x)=\frac{10}{11}x\). Therefore, an equation that defines \(h\) is \(h(x)=\frac{10}{11}x\).` + '\n\n' + ce('B', 'C', 'D'),
  },
  {
    id: '17d80dc3', skill: S, type: 'spr', accepted: ['7'],
    prompt: R`In the xy-plane, line \(k\) has a slope of \(5\) and a y-intercept of \((0, -35)\). What is the x-coordinate of the x-intercept of line \(k\)?`,
    explanation: R`The correct answer is \(7\). An equation of a line in the xy-plane can be written in the form \(y=mx+b\), where \(m\) is the slope of the line and \((0, b)\) is the y-intercept of the line. It's given that line \(k\) has a slope of \(5\) and a y-intercept of \((0, -35)\). Therefore, \(m=5\) and \(b=-35\). Substituting \(5\) for \(m\) and \(-35\) for \(b\) in the equation \(y=mx+b\) yields \(y=5x-35\). The x-intercept of a line in the xy-plane is the point where the line intersects the x-axis, which is a point with a y-coordinate of \(0\). Substituting \(0\) for \(y\) in the equation \(y=5x-35\) yields \(0=5x-35\). Adding \(35\) to both sides of this equation yields \(35=5x\). Dividing both sides of this equation by \(5\) yields \(7=x\). Therefore, the x-coordinate of the x-intercept of line \(k\) is \(7\).`,
  },
  {
    id: 'af711d1b', skill: S, type: 'mcq', answer: 'C',
    prompt: R`\[\begin{array}{|c|c|}\hline \textbf{Distance (kilometers)} & \textbf{Average time (minutes)}\\\hline 0.32 & 8\\\hline 0.56 & 14\\\hline 0.68 & 17\\\hline\end{array}\]
The table gives the average time \(t\), in minutes, it takes Carly to travel a certain distance \(d\), in kilometers. Which equation could represent this linear relationship?`,
    options: [R`\(t=4d\)`, R`\(t=\frac{1}{25}d\)`, R`\(t=25d\)`, R`\(t=\frac{1}{4}d\)`],
    explanation: R`Choice C is correct. The average time \(t\), in minutes, it takes Carly to travel a certain distance \(d\), in kilometers, is given in the table. This linear relationship can be represented by an equation in the form \(t=ad+b\), where \(a\) and \(b\) are constants. The table shows that it takes Carly an average time of \(8\) minutes to travel \(0.32\) kilometers. Substituting \(8\) for \(t\) and \(0.32\) for \(d\) in the equation \(t=ad+b\) yields \(8=0.32a+b\). Subtracting \(0.32a\) from both sides of this equation yields \(8-0.32a=b\). The table also shows that it takes Carly an average time of \(14\) minutes to travel \(0.56\) kilometers. Substituting \(14\) for \(t\) and \(0.56\) for \(d\) in the equation \(t=ad+b\) yields \(14=0.56a+b\). Subtracting \(0.56a\) from both sides of this equation yields \(14-0.56a=b\). Substituting \(8-0.32a\) for \(b\) in this equation yields \(14-0.56a=8-0.32a\). Subtracting \(8\) from both sides of this equation yields \(6-0.56a=-0.32a\). Adding \(0.56a\) to both sides of this equation yields \(6=0.24a\). Dividing both sides of this equation by \(0.24\) yields \(25=a\). Substituting \(25\) for \(a\) in the equation \(8=0.32a+b\) yields \(8=0.32(25)+b\), or \(8=8+b\). Subtracting \(8\) from both sides of this equation yields \(0=b\). Substituting \(25\) for \(a\) and \(0\) for \(b\) in the equation \(t=ad+b\) yields \(t=25d+0\), or \(t=25d\).` + '\n\n' + ce('A', 'B', 'D'),
  },
  {
    id: '5cf1bbc9', skill: S, type: 'mcq', answer: 'A', image: IMG('5cf1bbc9'),
    prompt: R`The graph of the function \(f\), where \(y=f(x)\), gives the total cost \(y\), in dollars, for a certain video game system and \(x\) games. What is the best interpretation of the slope of the graph in this context?`,
    options: [R`Each game costs \(\$25\).`, R`The video game system costs \(\$100\).`, R`The video game system costs \(\$25\).`, R`Each game costs \(\$100\).`],
    explanation: R`Choice A is correct. The given graph is a line, and the slope of a line is defined as the change in the value of \(y\) for each increase in the value of \(x\) by \(1\). It's given that \(y\) represents the total cost, in dollars, and that \(x\) represents the number of games. Therefore, the change in the value of \(y\) for each increase in the value of \(x\) by \(1\) represents the change in total cost, in dollars, for each increase in the number of games by \(1\). In other words, the slope represents the cost, in dollars, per game. The graph shows that when the value of \(x\) increases from \(0\) to \(1\), the value of \(y\) increases from \(100\) to \(125\). It follows that the slope is \(25\), or the cost per game is \(\$25\). Thus, the best interpretation of the slope of the graph is that each game costs \(\$25\).

Choice B is incorrect. This is an interpretation of the y-intercept of the graph rather than the slope of the graph.

Choice C is incorrect. The slope of the graph is the cost per game, not the cost of the video game system.

Choice D is incorrect. Each game costs \(\$25\), not \(\$100\).`,
  },
  {
    id: 'fc4a0d2a', skill: S, type: 'mcq', answer: 'A',
    prompt: R`\[g(x)=3(14x-15)\]
What is the y-coordinate of the y-intercept of the graph of \(y=g(x)-2\) in the xy-plane?`,
    options: [R`\(-47\)`, R`\(-45\)`, R`\(-17\)`, R`\(-15\)`],
    explanation: R`Choice A is correct. It's given that \(g(x)=3(14x-15)\). Substituting \(3(14x-15)\) for \(g(x)\) in the equation \(y=g(x)-2\) yields \(y=3(14x-15)-2\). The y-intercept of the graph of a function in the xy-plane is the point where the function crosses the y-axis, which occurs when \(x=0\). Substituting \(0\) for \(x\) in the equation \(y=3(14x-15)-2\) yields \(y=3(14(0)-15)-2\). It follows that \(y=-45-2\), or \(y=-47\). Therefore, the y-intercept of the graph of \(y=g(x)-2\) in the xy-plane is \((0, -47)\), and the y-coordinate of the y-intercept of the graph is \(-47\).

Choice B is incorrect. This is the y-coordinate of the y-intercept of the graph of \(y=g(x)\) in the xy-plane, not \(y=g(x)-2\).` + '\n\n' + ce('C', 'D'),
  },
  {
    id: 'a775af14', skill: S, type: 'mcq', answer: 'C',
    prompt: R`In the xy-plane, the graph of the linear function \(f\) contains the points \((0, 2)\) and \((8, 34)\). Which equation defines \(f\), where \(y=f(x)\)?`,
    options: [R`\(f(x)=2x+42\)`, R`\(f(x)=32x+36\)`, R`\(f(x)=4x+2\)`, R`\(f(x)=8x+2\)`],
    explanation: R`Choice C is correct. In the xy-plane, the graph of a linear function can be written in the form \(f(x)=mx+b\), where \(m\) represents the slope and \((0, b)\) represents the y-intercept of the graph of \(y=f(x)\). It's given that the graph of the linear function \(f\), where \(y=f(x)\), in the xy-plane contains the point \((0, 2)\). Thus, \(b=2\). The slope of the graph of a line containing any two points \((x_1, y_1)\) and \((x_2, y_2)\) can be found using the slope formula, \(m=\frac{y_2-y_1}{x_2-x_1}\). Since it's given that the graph of the linear function \(f\) contains the points \((0, 2)\) and \((8, 34)\), it follows that the slope of the graph of the line containing these points is \(m=\frac{34-2}{8-0}\), or \(m=4\). Substituting \(4\) for \(m\) and \(2\) for \(b\) in \(f(x)=mx+b\) yields \(f(x)=4x+2\).

Choice A is incorrect. This function represents a graph with a slope of \(2\) and a y-intercept of \((0, 42)\).

Choice B is incorrect. This function represents a graph with a slope of \(32\) and a y-intercept of \((0, 36)\).

Choice D is incorrect. This function represents a graph with a slope of \(8\) and a y-intercept of \((0, 2)\).`,
  },
  {
    id: 'dae126d7', skill: S, type: 'mcq', answer: 'D',
    prompt: R`The boiling point of water at sea level is 212 degrees Fahrenheit \((^\circ\text{F})\). For every 550 feet above sea level, the boiling point of water is lowered by about \(1^\circ\text{F}\). Which of the following equations can be used to find the boiling point B of water, in \(^\circ\text{F}\), x feet above sea level?`,
    options: [R`\(B=550+\dfrac{x}{212}\)`, R`\(B=550-\dfrac{x}{212}\)`, R`\(B=212+\dfrac{x}{550}\)`, R`\(B=212-\dfrac{x}{550}\)`],
    explanation: R`Choice D is correct. It's given that the boiling point of water at sea level is 212°F and that for every 550 feet above sea level, the boiling point of water is lowered by about 1°F. Therefore, the change in the boiling point of water x feet above sea level is represented by the expression \(-\frac{x}{550}\). Adding this expression to the boiling point of water at sea level gives the equation for the boiling point B of water, in °F, x feet above sea level: \(B=-\frac{x}{550}+212\), or \(B=212-\frac{x}{550}\).

Choices A and B are incorrect and may result from using the boiling point of water at sea level as the rate of change and the rate of change as the initial boiling point of water at sea level. Choice C is incorrect and may result from representing the change in the boiling point of water as an increase rather than a decrease.`,
  },
  {
    id: '271f7e3f', skill: S, type: 'mcq', answer: 'B',
    prompt: R`\[f(x)=\frac{(x+7)}{4}\]
For the function f defined above, what is the value of \(f(9)-f(1)\)?`,
    options: ['1', '2', R`\(\dfrac{1}{4}\)`, R`\(\dfrac{9}{4}\)`],
    explanation: R`Choice B is correct. The value of \(f(9)-f(1)\) can be calculated by finding the values of \(f(9)\) and \(f(1)\). The value of \(f(9)\) can be found by substituting 9 for x in the given function: \(f(9)=\frac{(9+7)}{4}\). This equation can be rewritten as \(f(9)=\frac{16}{4}\), or 4. Then, the value of \(f(1)\) can be found by substituting 1 for x in the given function: \(f(1)=\frac{(1+7)}{4}\). This equation can be rewritten as \(f(1)=\frac{8}{4}\), or 2. Therefore, \(f(9)-f(1)=4-2\), which is equivalent to 2.

Choices A, C, and D are incorrect and may result from incorrectly substituting values of x in the given function or making computational errors.`,
  },
  {
    id: 'c651cc56', skill: S, type: 'mcq', answer: 'B',
    prompt: R`\[\begin{array}{|c|c|}\hline x & f(x)\\\hline 0 & -2\\\hline 2 & 4\\\hline 6 & 16\\\hline\end{array}\]
Some values of the linear function f are shown in the table above. What is the value of \(f(3)\)?`,
    options: ['6', '7', '8', '9'],
    explanation: R`Choice B is correct. A linear function has a constant rate of change, and any two rows of the table shown can be used to calculate this rate. From the first row to the second, the value of x is increased by 2 and the value of \(f(x)\) is increased by \(6=4-(-2)\). So the values of \(f(x)\) increase by 3 for every increase by 1 in the value of x. Since \(f(2)=4\), it follows that \(f(2+1)=4+3=7\). Therefore, \(f(3)=7\).

Choice A is incorrect. This is the third x-value in the table, not \(f(3)\). Choices C and D are incorrect and may result from errors when calculating the function's rate of change.`,
  },
  {
    id: 'c22b5f25', skill: S, type: 'mcq', answer: 'C',
    prompt: R`In the xy-plane, the points \((-2, 3)\) and \((4, -5)\) lie on the graph of which of the following linear functions?`,
    options: [R`\(f(x)=x+5\)`, R`\(f(x)=\dfrac{1}{2}x+4\)`, R`\(f(x)=-\dfrac{4}{3}x+\dfrac{1}{3}\)`, R`\(f(x)=-\dfrac{3}{2}x+1\)`],
    explanation: R`Choice C is correct. A linear function can be written in the form \(f(x)=mx+b\), where m is the slope and b is the y-coordinate of the y-intercept of the line. The slope of the graph can be found using the formula \(m=\frac{y_2-y_1}{x_2-x_1}\). Substituting the values of the given points into this formula yields \(m=\frac{-5-3}{4-(-2)}\) or \(m=\frac{-8}{6}\), which simplifies to \(m=-\frac{4}{3}\). Only choice C shows an equation with this slope.

Choices A, B, and D are incorrect and may result from computation errors or misinterpreting the given information.`,
  },
  {
    id: '11e1ab81', skill: S, type: 'mcq', answer: 'A', image: IMG('11e1ab81'),
    prompt: 'The graph above shows the distance traveled d, in feet, by a product on a conveyor belt m minutes after the product is placed on the belt. Which of the following equations correctly relates d and m ?',
    options: [R`\(d=2m\)`, R`\(d=\dfrac{1}{2}m\)`, R`\(d=m+2\)`, R`\(d=2m+2\)`],
    explanation: R`Choice A is correct. The line passes through the origin. Therefore, this is a relationship of the form \(d=km\), where k is a constant representing the slope of the graph. To find the value of k, choose a point \((m, d)\) on the graph of the line other than the origin and substitute the values of m and d into the equation. For example, if the point \((2, 4)\) is chosen, then \(4=k(2)\), and \(k=2\). Therefore, the equation of the line is \(d=2m\).

Choice B is incorrect and may result from calculating the slope of the line as the change in time over the change in distance traveled instead of the change in distance traveled over the change in time. Choices C and D are incorrect because each of these equations represents a line with a d-intercept of 2. However, the graph shows a line with a d-intercept of 0.`,
  },
  {
    id: '4fe4fd7c', skill: S, type: 'spr', accepted: ['3500'],
    prompt: R`\[c(x)=mx+500\]
A company's total cost \(c(x)\), in dollars, to produce x shirts is given by the function above, where m is a constant and \(x>0\). The total cost to produce 100 shirts is $800. What is the total cost, in dollars, to produce 1000 shirts? (Disregard the $ sign when gridding your answer.)`,
    explanation: R`The correct answer is 3500. The given information includes a cost, $800, to produce 100 shirts. Substituting \(c(x)=800\) and \(x=100\) into the given equation yields \(800=m\cdot 100+500\). Subtracting 500 from both sides of the equation yields \(300=m\cdot 100\). Dividing both sides of this equation by 100 yields \(3=m\). Substituting the value of m into the given equation yields \(c(x)=3x+500\). Substituting 1000 for x in this equation and solving for \(c(x)\) gives the cost of 1000 shirts: \(3(1000)+500\), or 3500.`,
  },
  {
    id: '2493c767', skill: S, type: 'mcq', answer: 'C',
    prompt: R`\[s(x)=133-4x\]
The function \(s\) shown gives the number of spoons, \(s(x)\), remaining in a dispenser \(x\) minutes after the dispenser had been loaded with spoons. Which statement is the best interpretation of \(s(3)=121\)?`,
    options: [
      R`The number of spoons remaining in the dispenser decreased by a total of \(3\) spoons after \(121\) minutes.`,
      R`There were \(3\) spoons remaining in the dispenser \(121\) minutes after the dispenser had been loaded with spoons.`,
      R`There were \(121\) spoons remaining in the dispenser \(3\) minutes after the dispenser had been loaded with spoons.`,
      R`The number of spoons remaining in the dispenser decreased by a total of \(121\) spoons after \(3\) minutes.`,
    ],
    explanation: R`Choice C is correct. It's given that \(s(x)\) is the number of spoons remaining in a dispenser \(x\) minutes after the dispenser had been loaded with spoons. The expression \(s(3)\) represents the value of \(s(x)\) when \(x=3\). It follows that \(s(3)\) represents the number of spoons remaining in the dispenser \(3\) minutes after it had been loaded with spoons. Therefore, the best interpretation of the equation \(s(3)=121\) is that there were \(121\) spoons remaining in the dispenser \(3\) minutes after it had been loaded with spoons.

Choice A is incorrect and may result from conceptual errors.

Choice B is incorrect. This would be the best interpretation of \(s(121)=3\), not \(s(3)=121\).

Choice D is incorrect and may result from conceptual errors.`,
  },
  {
    id: '23dedddd', skill: S, type: 'mcq', answer: 'D',
    prompt: R`In the linear function \(f\), \(f(0)=8\) and \(f(1)=12\). Which equation defines \(f\)?`,
    options: [R`\(f(x)=12x+8\)`, R`\(f(x)=4x\)`, R`\(f(x)=4x+12\)`, R`\(f(x)=4x+8\)`],
    explanation: R`Choice D is correct. Since \(f\) is a linear function, it can be defined by an equation of the form \(f(x)=ax+b\), where \(a\) and \(b\) are constants. It's given that \(f(0)=8\). Substituting \(0\) for \(x\) and \(8\) for \(f(x)\) in the equation \(f(x)=ax+b\) yields \(8=a(0)+b\), or \(8=b\). Substituting \(8\) for \(b\) in the equation \(f(x)=ax+b\) yields \(f(x)=ax+8\). It's given that \(f(1)=12\). Substituting \(1\) for \(x\) and \(12\) for \(f(x)\) in the equation \(f(x)=ax+8\) yields \(12=a(1)+8\), or \(12=a+8\). Subtracting \(8\) from both sides of this equation yields \(a=4\). Substituting \(4\) for \(a\) in the equation \(f(x)=ax+8\) yields \(f(x)=4x+8\). Therefore, an equation that defines \(f\) is \(f(x)=4x+8\).` + '\n\n' + ce('A', 'B', 'C'),
  },
  {
    id: 'a91a2b75', skill: S, type: 'spr', accepted: ['9'],
    prompt: R`The function \(f\) is defined by \(f(x)=-9x+9\). What is the \(y\)-coordinate of the \(y\)-intercept of the graph of \(y=f(x)\) in the \(xy\)-plane?`,
    explanation: R`The correct answer is \(9\). The y-intercept of the graph of \(y=f(x)\) in the xy-plane is the point where the graph of \(y=f(x)\) crosses the y-axis, which occurs at \(x=0\). It's given that the function \(f\) is defined by \(f(x)=-9x+9\). Substituting \(0\) for \(x\) and \(y\) for \(f(x)\) in this equation yields \(y=-9(0)+9\), or \(y=9\). It follows that \(y=9\) when \(x=0\) and that the y-intercept of the graph of \(y=f(x)\) in the xy-plane is \((0, 9)\). Therefore, the y-coordinate of the y-intercept of the graph of \(y=f(x)\) in the xy-plane is \(9\).`,
  },
  {
    id: '868fc236', skill: S, type: 'mcq', answer: 'B',
    prompt: R`\[\begin{array}{c}\text{Energy per Gram of Typical Macronutrients}\\[4pt]\begin{array}{|l|c|c|}\hline \text{Macronutrient} & \text{Food calories} & \text{Kilojoules}\\\hline \text{Protein} & 4.0 & 16.7\\\hline \text{Fat} & 9.0 & 37.7\\\hline \text{Carbohydrate} & 4.0 & 16.7\\\hline\end{array}\end{array}\]
The table above gives the typical amounts of energy per gram, expressed in both food calories and kilojoules, of the three macronutrients in food. If x food calories is equivalent to k kilojoules, of the following, which best represents the relationship between x and k ?`,
    options: [R`\(k=0.24x\)`, R`\(k=4.2x\)`, R`\(x=4.2k\)`, R`\(xk=4.2\)`],
    explanation: R`Choice B is correct. The relationship between x food calories and k kilojoules can be modeled as a proportional relationship. Let \((x_1, k_1)\) and \((x_2, k_2)\) represent the values in the first two rows in the table: \((4.0, 16.7)\) and \((9.0, 37.7)\). The rate of change, or \(\frac{(k_2-k_1)}{(x_2-x_1)}\), is \(\frac{21}{5}=4.2\); therefore, the equation that best represents the relationship between x and k is \(k=4.2x\).

Choice A is incorrect and may be the result of calculating the rate of change using \(\frac{(x_2-x_1)}{(k_2-k_1)}\). Choice C is incorrect because the number of kilojoules is greater than the number of food calories. Choice D is incorrect and may be the result of an error when setting up the equation.`,
  },
  {
    id: '042aa429', skill: S, type: 'mcq', answer: 'C',
    prompt: R`If \(f(x)=x+7\) and \(g(x)=7x\), what is the value of \(4f(2)-g(2)\)?`,
    options: [R`\(-5\)`, R`\(1\)`, R`\(22\)`, R`\(28\)`],
    explanation: R`Choice C is correct. The value of \(f(2)\) can be found by substituting \(2\) for \(x\) in the given equation \(f(x)=x+7\), which yields \(f(2)=2+7\), or \(f(2)=9\). The value of \(g(2)\) can be found by substituting \(2\) for \(x\) in the given equation \(g(x)=7x\), which yields \(g(2)=7(2)\), or \(g(2)=14\). The value of the expression \(4f(2)-g(2)\) can be found by substituting the corresponding values into the expression, which gives \(4(9)-14\). This expression is equivalent to \(36-14\), or \(22\).

Choice A is incorrect. This is the value of \(f(2)-g(2)\), not \(4f(2)-g(2)\).

Choice B is incorrect and may result from calculating \(4f(2)\) as \(4(2)+7\), rather than \(4(2+7)\).

Choice D is incorrect and may result from conceptual or calculation errors.`,
  },
  {
    id: 'b2fe7ab6', skill: S, type: 'mcq', answer: 'D',
    prompt: R`\[\begin{array}{|c|c|}\hline x & g(x)\\\hline 1 & 54\\\hline 2 & 51\\\hline 3 & 48\\\hline 4 & 45\\\hline\end{array}\]
For the linear function \(g\), the table shows four values of \(x\) and their corresponding values of \(g(x)\). The function can be written as \(g(x)=mx+b\), where \(m\) and \(b\) are constants. What is the value of \(b\)?`,
    options: [R`\(3\)`, R`\(27\)`, R`\(54\)`, R`\(57\)`],
    explanation: R`Choice D is correct. It's given that for the linear function \(g\), the table shows four values of \(x\) and their corresponding values of \(g(x)\). It's also given that the function can be written as \(g(x)=mx+b\), where \(m\) and \(b\) are constants. The table shows that when the value of \(x\) is \(1\), the corresponding value of \(g(x)\) is \(54\). Substituting \(1\) for \(x\) and \(54\) for \(g(x)\) in \(g(x)=mx+b\) yields \(54=m(1)+b\) or, \(54=m+b\). Subtracting \(b\) from both sides of this equation yields \(54-b=m\). The table also shows that when the value of \(x\) is \(2\), the corresponding value of \(g(x)\) is \(51\). Substituting \(2\) for \(x\) and \(51\) for \(g(x)\) in \(g(x)=mx+b\) yields \(51=m(2)+b\), or \(51=2m+b\). Substituting \(54-b\) for \(m\) in this equation yields \(51=2(54-b)+b\). Applying the distributive property to the right-hand side of this equation yields \(51=108-2b+b\), or \(51=108-b\). Subtracting \(108\) from both sides of this equation yields \(-57=-b\). Dividing both sides of this equation by \(-1\) yields \(57=b\).` + '\n\n' + ce('A', 'B', 'C'),
  },
  {
    id: '113b938e', skill: S, type: 'mcq', answer: 'C',
    prompt: R`\[y=18-5x\]
The equation above represents the speed y, in feet per second, of Sheila's bicycle x seconds after she applied the brakes at the end of a ride. If the equation is graphed in the xy-plane, which of the following is the best interpretation of the x-coordinate of the line's x-intercept in the context of the problem?`,
    options: [
      'The speed of Sheila’s bicycle, in feet per second, before Sheila applied the brakes',
      'The number of feet per second the speed of Sheila’s bicycle decreased each second after Sheila applied the brakes',
      'The number of seconds it took from the time Sheila began applying the brakes until the bicycle came to a complete stop',
      'The number of feet Sheila’s bicycle traveled from the time she began applying the brakes until the bicycle came to a complete stop',
    ],
    explanation: R`Choice C is correct. It’s given that for each point \((x, y)\) on the graph of the given equation, the x-coordinate represents the number of seconds after Sheila applied the brakes, and the y-coordinate represents the speed of Sheila’s bicycle at that moment in time. For the graph of the equation, the y-coordinate of the x-intercept is 0. Therefore, the x-coordinate of the x-intercept of the graph of the given equation represents the number of seconds it took from the time Sheila began applying the brakes until the bicycle came to a complete stop.

Choice A is incorrect. The speed of Sheila’s bicycle before she applied the brakes is represented by the y-coordinate of the y-intercept of the graph of the given equation, not the x-coordinate of the x-intercept. Choice B is incorrect. The number of feet per second the speed of Sheila’s bicycle decreased each second after Sheila applied the brakes is represented by the slope of the graph of the given equation, not the x-coordinate of the x-intercept. Choice D is incorrect and may result from misinterpreting x as the distance, in feet, traveled after applying the brakes, rather than the time, in seconds, after applying the brakes.`,
  },
  {
    id: 'c387583f', skill: S, type: 'spr', accepted: ['-42'],
    prompt: R`In the xy-plane, line \(k\) passes through the points \((8, 6)\) and \((9, 12)\) and is defined by the equation \(y=mx+b\). What is the value of \(b\)?`,
    explanation: R`The correct answer is \(-42\). For a linear equation in the form \(y=mx+b\), \(m\) represents the slope and \(b\) represents the y-coordinate of the y-intercept of the graph in the xy-plane. The slope of the graph of a line containing any two points, \((x_1, y_1)\) and \((x_2, y_2)\), can be found using the slope formula \(m=\frac{y_2-y_1}{x_2-x_1}\). It's given that in the xy-plane, line \(k\) passes through the points \((8, 6)\) and \((9, 12)\). Substituting \((8, 6)\) and \((9, 12)\) for \((x_1, y_1)\) and \((x_2, y_2)\), respectively, in the slope formula yields \(m=\frac{12-6}{9-8}\), or \(m=6\). Since line \(k\) passes through the point \((9, 12)\) and the slope of the line is \(6\), substituting \(9\) for \(x\), \(12\) for \(y\), and \(6\) for \(m\) in the equation \(y=mx+b\) yields \(12=(6)(9)+b\), or \(12=54+b\). Subtracting \(54\) from both sides of this equation yields \(-42=b\). Therefore, the value of \(b\) is \(-42\).`,
  },
  {
    id: 'f0773a55', skill: S, type: 'mcq', answer: 'A', image: IMG('f0773a55'),
    prompt: R`The graph represents the total charge, in dollars, by an electrician for \(x\) hours of work. The electrician charges a onetime fee plus an hourly rate. What is the best interpretation of the slope of the graph?`,
    options: ['The electrician’s hourly rate', 'The electrician’s onetime fee', 'The maximum amount that the electrician charges', 'The total amount that the electrician charges'],
    explanation: R`Choice A is correct. It's given that the electrician charges a onetime fee plus an hourly rate. It's also given that the graph represents the total charge, in dollars, for \(x\) hours of work. This graph shows a linear relationship in the xy-plane. Thus, the total charge \(y\), in dollars, for \(x\) hours of work can be represented as \(y=mx+b\), where \(m\) is the slope and \((0, b)\) is the y-intercept of the graph of the equation in the xy-plane. Since the given graph represents the total charge, in dollars, by an electrician for \(x\) hours of work, it follows that its slope is \(m\), or the electrician's hourly rate.

Choice B is incorrect. The electrician's onetime fee is represented by the y-coordinate of the y-intercept, not the slope, of the graph.` + '\n\n' + cerr('C', 'D'),
  },
  {
    id: '8a6de407', skill: S, type: 'spr', accepted: ['2'],
    prompt: R`The function f is defined by \(f(x)=mx+b\), where m and b are constants. If \(f(0)=18\) and \(f(1)=20\), what is the value of m ?`,
    explanation: R`The correct answer is 2. The slope-intercept form of an equation for a line is \(y=mx+b\), where m is the slope and b is the y-coordinate of the y-intercept. Two ordered pairs, \((x_1, y_1)\) and \((x_2, y_2)\), can be used to compute the slope using the formula \(m=\frac{y_2-y_1}{x_2-x_1}\). It's given that \(f(0)=18\) and \(f(1)=20\); therefore, the two ordered pairs for this line are \((0, 18)\) and \((1, 20)\). Substituting these values for \((x_1, y_1)\) and \((x_2, y_2)\) gives \(\frac{20-18}{1-0}=\frac{2}{1}\), or 2.`,
  },
  {
    id: '41fdc0b8', skill: S, type: 'mcq', answer: 'A',
    prompt: R`\[\begin{array}{c}\text{Population of Greenleaf, Idaho}\\[4pt]\begin{array}{|c|c|}\hline \text{Year} & \text{Population}\\\hline 2000 & 862\\\hline 2010 & 846\\\hline\end{array}\end{array}\]
The table above shows the population of Greenleaf, Idaho, for the years 2000 and 2010. If the relationship between population and year is linear, which of the following functions P models the population of Greenleaf t years after 2000?`,
    options: [R`\(P(t)=862-1.6t\)`, R`\(P(t)=862-16t\)`, R`\(P(t)=862+16(t-2{,}000)\)`, R`\(P(t)=862-1.6(t-2{,}000)\)`],
    explanation: R`Choice A is correct. It is given that the relationship between population and year is linear; therefore, the function that models the population t years after 2000 is of the form \(P(t)=mt+b\), where m is the slope and b is the population when \(t=0\). In the year 2000, \(t=0\). Therefore, \(b=862\). The slope is given by \(m=\frac{P(10)-P(0)}{10-0}=\frac{846-862}{10-0}=\frac{-16}{10}=-1.6\). Therefore, \(P(t)=-1.6t+862\), which is equivalent to the equation in choice A.

Choice B is incorrect and may be the result of incorrectly calculating the slope as just the change in the value of P. Choice C is incorrect and may be the result of the same error as in choice B, in addition to incorrectly using t to represent the year, instead of the number of years after 2000. Choice D is incorrect and may be the result of incorrectly using t to represent the year instead of the number of years after 2000.`,
  },
];
