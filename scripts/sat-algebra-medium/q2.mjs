// Linear equations in two variables (27).
import { ce, cerr } from './q1.mjs';

const R = String.raw;
const S = 'Linear equations in two variables';
const IMG = (id) => `/hub/visuals/sat/${id}.png`;

export default [
  {
    id: '002dba45', skill: S, type: 'spr', accepted: ['.1764', '.1765', '0.176', '3/17'],
    prompt: R`Line \(k\) is defined by \(y=-\frac{17}{3}x+5\). Line \(j\) is perpendicular to line \(k\) in the xy-plane. What is the slope of line \(j\)?`,
    explanation: R`The correct answer is \(\frac{3}{17}\). It's given that line \(j\) is perpendicular to line \(k\) in the xy-plane. This means that the slope of line \(j\) is the negative reciprocal of the slope of line \(k\). The equation of line \(k\), \(y=-\frac{17}{3}x+5\), is written in slope-intercept form \(y=mx+b\), where \(m\) is the slope of the line and \(b\) is the y-coordinate of the y-intercept of the line. It follows that the slope of line \(k\) is \(-\frac{17}{3}\). The negative reciprocal of a number is \(-1\) divided by the number. Therefore, the negative reciprocal of \(-\frac{17}{3}\) is \(\frac{-1}{-\frac{17}{3}}\), or \(\frac{3}{17}\). Thus, the slope of line \(j\) is \(\frac{3}{17}\). Note that 3/17, .1764, .1765, and 0.176 are examples of ways to enter a correct answer.`,
  },
  {
    id: '9b0a4eae', skill: S, type: 'mcq', answer: 'C', image: IMG('9b0a4eae'),
    prompt: R`The graph in the xy-plane models the possible combinations of length \(x\), in meters (m), and width \(y\), in meters, for a rectangle with a perimeter of \(36\text{ m}\). Which statement is the best interpretation of the point \((8, 10)\) in this context?`,
    options: [
      R`The length is \(10\text{ m}\) less than the perimeter, and the width is \(8\text{ m}\) less than the perimeter.`,
      R`The length is \(10\text{ m}\), and the width is \(8\text{ m}\).`,
      R`The length is \(8\text{ m}\), and the width is \(10\text{ m}\).`,
      R`The length is \(8\text{ m}\) less than the perimeter, and the width is \(10\text{ m}\) less than the perimeter.`,
    ],
    explanation: R`Choice C is correct. It's given that the graph in the xy-plane models the possible combinations of length \(x\), in meters (m), and width \(y\), in meters, for a rectangle with a perimeter of \(36\) m. Since \(x\) represents the length, in meters, and \(y\) represents the width, in meters, the point \((8, 10)\) in the xy-plane represents a rectangle whose length is \(8\) m and whose width is \(10\) m.

Choice A is incorrect and may result from conceptual errors.

Choice B is incorrect. This is an interpretation of the point \((10, 8)\), not \((8, 10)\).

Choice D is incorrect and may result from conceptual errors.`,
  },
  {
    id: '1087f6c4', skill: S, type: 'spr', accepted: ['0.25', '.25', '1/4'],
    prompt: R`\[24.5x+24.75y=641\]
Isabel ordered topsoil and crushed stone, which cost a total of \(\$641\), for her garden. The given equation represents the relationship between the number of cubic yards of topsoil, \(x\), and the number of tons of crushed stone, \(y\), Isabel ordered. How much more, in dollars, did a ton of crushed stone cost Isabel than a cubic yard of topsoil?`,
    explanation: R`The correct answer is \(.25\). It's given that the topsoil and crushed stone Isabel ordered for her garden cost a total of \(\$641\). It's also given that the equation \(24.5x+24.75y=641\) represents the relationship between the number of cubic yards of topsoil, \(x\), and the number of tons of crushed stone, \(y\), that Isabel ordered. Since \(x\) represents the number of cubic yards of topsoil ordered, \(24.5x\) represents the total cost, in dollars, of the topsoil, and the cost per cubic yard of topsoil is \(\$24.50\). Similarly, since \(y\) represents the number of tons of crushed stone ordered, \(24.75y\) represents the total cost, in dollars, of crushed stone ordered, and the cost per ton of crushed stone is \(\$24.75\). Therefore, a ton of crushed stone cost Isabel \(24.75-24.50\), or \(0.25\), more dollars than a cubic yard of topsoil. Note that .25 and 1/4 are examples of ways to enter a correct answer.`,
  },
  {
    id: '7625073d', skill: S, type: 'spr', accepted: ['49'],
    prompt: R`The equation \(7g+7b=840\) represents the number of blue tiles, \(b\), and the number of green tiles, \(g\), an artist needs for an \(840\)-square-inch tile project. The artist needs \(71\) blue tiles for the project. How many green tiles does he need?`,
    explanation: R`The correct answer is \(49\). It's given that the equation \(7g+7b=840\) represents the number of blue tiles, \(b\), and the number of green tiles, \(g\), an artist needs for an \(840\)-square-inch tile project. It's also given that the artist needs \(71\) blue tiles for the project. Substituting \(71\) for \(b\) in the equation \(7g+7b=840\) yields \(7g+7(71)=840\), or \(7g+497=840\). Subtracting \(497\) from both sides of this equation yields \(7g=343\). Dividing both sides of this equation by \(7\) yields \(g=49\). Therefore, the artist needs \(49\) green tiles for the project.`,
  },
  {
    id: '9f3cb472', skill: S, type: 'mcq', answer: 'D',
    prompt: R`Line \(t\) in the xy-plane has a slope of \(-\frac{1}{3}\) and passes through the point \((9, 10)\). Which equation defines line \(t\)?`,
    options: [R`\(y=13x-\frac{1}{3}\)`, R`\(y=9x+10\)`, R`\(y=-\frac{x}{3}+10\)`, R`\(y=-\frac{x}{3}+13\)`],
    explanation: R`Choice D is correct. The equation that defines line \(t\) in the xy-plane can be written in slope-intercept form \(y=mx+b\), where \(m\) is the slope of line \(t\) and \((0, b)\) is its y-intercept. It's given that line \(t\) has a slope of \(-\frac{1}{3}\). Therefore, \(m=-\frac{1}{3}\). Substituting \(-\frac{1}{3}\) for \(m\) in the equation \(y=mx+b\) yields \(y=-\frac{1}{3}x+b\), or \(y=-\frac{x}{3}+b\). It's also given that line \(t\) passes through the point \((9, 10)\). Substituting \(9\) for \(x\) and \(10\) for \(y\) in the equation \(y=-\frac{x}{3}+b\) yields \(10=-\frac{9}{3}+b\), or \(10=-3+b\). Adding \(3\) to both sides of this equation yields \(13=b\). Substituting \(13\) for \(b\) in the equation \(y=-\frac{x}{3}+b\) yields \(y=-\frac{x}{3}+13\).

Choice A is incorrect and may result from conceptual or calculation errors.

Choice B is incorrect. This equation defines a line that has a slope of \(9\), not \(-\frac{1}{3}\), and passes through the point \((0, 10)\), not \((9, 10)\).

Choice C is incorrect. This equation defines a line that passes through the point \((0, 10)\), not \((9, 10)\).`,
  },
  {
    id: 'd7c8ba0b', skill: S, type: 'mcq', answer: 'D',
    prompt: R`In the xy-plane, line \(t\) passes through the points \((0, 9)\) and \((1, 17)\). Which equation defines line \(t\)?`,
    options: [R`\(y=\frac{1}{8}x+9\)`, R`\(y=x+\frac{1}{8}\)`, R`\(y=x+8\)`, R`\(y=8x+9\)`],
    explanation: R`Choice D is correct. An equation defining a line in the xy-plane can be written in the form \(y=mx+b\), where \(m\) represents the slope and \((0, b)\) represents the y-intercept of the line. It's given that line \(t\) passes through the point \((0, 9)\); therefore, \(b=9\). The slope, \(m\), of a line can be found using any two points on the line, \((x_1, y_1)\) and \((x_2, y_2)\), and the slope formula \(m=\frac{y_2-y_1}{x_2-x_1}\). Substituting \((0, 9)\) and \((1, 17)\) for \((x_1, y_1)\) and \((x_2, y_2)\), respectively, in the slope formula yields \(m=\frac{17-9}{1-0}\), or \(m=8\). Substituting \(8\) for \(m\) and \(9\) for \(b\) in the equation \(y=mx+b\) yields \(y=8x+9\).` + '\n\n' + ce('A', 'B', 'C'),
  },
  {
    id: '99ea3715', skill: S, type: 'mcq', answer: 'A',
    prompt: R`If the graph of \(27x+33y=297\) is shifted down \(5\) units in the xy-plane, what is the y-intercept of the resulting graph?`,
    options: [R`\((0, 4)\)`, R`\((0, 6)\)`, R`\((0, 14)\)`, R`\((0, 28)\)`],
    explanation: R`Choice A is correct. When the graph of an equation in the form \(Ax+By=C\), where \(A\), \(B\), and \(C\) are constants, is shifted down \(k\) units in the xy-plane, the resulting graph can be represented by the equation \(Ax+B(y+k)=C\). It's given that the graph of \(27x+33y=297\) is shifted down \(5\) units in the xy-plane. Therefore, the resulting graph can be represented by the equation \(27x+33(y+5)=297\), or \(27x+33y+165=297\). Subtracting \(165\) from both sides of this equation yields \(27x+33y=132\). The y-intercept of the graph of an equation in the xy-plane is the point where the line intersects the y-axis, represented by the point \((0, y)\). Substituting \(0\) for \(x\) in the equation \(27x+33y=132\) yields \(27(0)+33y=132\), or \(33y=132\). Dividing both sides of this equation by \(33\) yields \(y=4\). Therefore, if the graph of \(27x+33y=297\) is shifted down \(5\) units, the y-intercept of the resulting graph is \((0, 4)\).

Choice B is incorrect and may result from conceptual or calculation errors.

Choice C is incorrect. This is the y-intercept of the graph of \(27x+33y=297\) shifted up, not down, \(5\) units.

Choice D is incorrect and may result from conceptual or calculation errors.`,
  },
  {
    id: '9aaf7786', skill: S, type: 'spr', accepted: ['-10'],
    prompt: R`In the xy-plane, line \(p\) has a slope of \(-\frac{5}{3}\) and an x-intercept of \((-6, 0)\). What is the y-coordinate of the y-intercept of line \(p\)?`,
    explanation: R`The correct answer is \(-10\). A line in the xy-plane can be represented by the equation \(y=mx+b\), where \(m\) is the slope of the line and \(b\) is the y-coordinate of the y-intercept. It's given that line \(p\) has a slope of \(-\frac{5}{3}\). Therefore, \(m=-\frac{5}{3}\). It's also given that line \(p\) has an x-intercept of \((-6, 0)\). Therefore, when \(x=-6\), \(y=0\). Substituting \(-\frac{5}{3}\) for \(m\), \(-6\) for \(x\), and \(0\) for \(y\) in the equation \(y=mx+b\) yields \(0=\left(-\frac{5}{3}\right)(-6)+b\), which is equivalent to \(0=10+b\). Subtracting \(10\) from both sides of this equation yields \(-10=b\). Therefore, the y-coordinate of the y-intercept of line \(p\) is \(-10\).`,
  },
  {
    id: '9c7741c6', skill: S, type: 'spr', accepted: ['3'],
    prompt: R`On a 210-mile trip, Cameron drove at an average speed of 60 miles per hour for the first x hours. He then completed the trip, driving at an average speed of 50 miles per hour for the remaining y hours. If \(x=1\), what is the value of y ?`,
    explanation: R`The correct answer is 3. It's given that Cameron drove 60 miles per hour for x hours; therefore, the distance driven at this speed can be represented by \(60x\). He then drove 50 miles per hour for y hours; therefore, the distance driven at this speed can be represented by \(50y\). Since Cameron drove 210 total miles, the equation \(60x+50y=210\) represents this situation. If \(x=1\), substitution yields \(60(1)+50y=210\), or \(60+50y=210\). Subtracting 60 from both sides of this equation yields \(50y=150\). Dividing both sides of this equation by 50 yields \(y=3\).`,
  },
  {
    id: 'bbb0359a', skill: S, type: 'mcq', answer: 'A',
    prompt: R`\[\begin{array}{|c|c|c|c|}\hline x & 1 & 2 & 3\\\hline y & 11 & 16 & 21\\\hline\end{array}\]
The table shows three values of \(x\) and their corresponding values of \(y\). Which equation represents the linear relationship between \(x\) and \(y\)?`,
    options: [R`\(y=5x+6\)`, R`\(y=5x+11\)`, R`\(y=6x+5\)`, R`\(y=6x+11\)`],
    explanation: R`Choice A is correct. The linear relationship between \(x\) and \(y\) can be represented by the equation \(y=mx+b\), where \(m\) is the slope of the line in the xy-plane that represents the relationship, and \(b\) is the y-coordinate of the y-intercept. The slope can be computed using any two points on the line. The slope of a line between any two points, \((x_1, y_1)\) and \((x_2, y_2)\), on the line can be calculated using the slope formula, \(m=\frac{y_2-y_1}{x_2-x_1}\). In the given table, each value of \(x\) and its corresponding value of \(y\) can be represented by a point \((x, y)\). In the given table, when the value of \(x\) is \(1\), the corresponding value of \(y\) is \(11\) and when the value of \(x\) is \(2\), the corresponding value of \(y\) is \(16\). Therefore, the points \((1, 11)\) and \((2, 16)\) are on the line. Substituting \((1, 11)\) and \((2, 16)\) for \((x_1, y_1)\) and \((x_2, y_2)\), respectively, in the slope formula yields \(m=\frac{16-11}{2-1}\), or \(m=5\). Substituting \(5\) for \(m\) in the equation \(y=mx+b\) yields \(y=5x+b\). Substituting the first value of \(x\) in the table, \(1\), and its corresponding value of \(y\), \(11\), for \(x\) and \(y\), respectively, in this equation yields \(11=5(1)+b\), or \(11=b+5\). Subtracting \(5\) from both sides of this equation yields \(6=b\). Substituting \(6\) for \(b\) in the equation \(y=5x+b\) yields \(y=5x+6\). Therefore, the equation \(y=5x+6\) represents the linear relationship between \(x\) and \(y\).

Choice B is incorrect. For this relationship, when the value of \(x\) is \(1\), the corresponding value of \(y\) is \(16\), not \(11\).

Choice C is incorrect. For this relationship, when the value of \(x\) is \(2\), the corresponding value of \(y\) is \(17\), not \(16\).

Choice D is incorrect. For this relationship, when the value of \(x\) is \(1\), the corresponding value of \(y\) is \(17\), not \(11\).`,
  },
  {
    id: '606cdce7', skill: S, type: 'mcq', answer: 'A',
    prompt: R`\[\begin{array}{|c|c|}\hline x & y\\\hline -6 & 65\\\hline -3 & 56\\\hline 3 & 38\\\hline 6 & 29\\\hline\end{array}\]
The table shows four values of \(x\) and their corresponding values of \(y\). There is a linear relationship between \(x\) and \(y\). Which of the following equations represents this relationship?`,
    options: [R`\(9x+3y=141\)`, R`\(9x+3y=3\)`, R`\(3x+9y=141\)`, R`\(3x+9y=3\)`],
    explanation: R`Choice A is correct. An equation representing the linear relationship between \(x\) and \(y\) can be written in slope-intercept form \(y=mx+b\), where \(m\) is the slope of the graph of the equation in the xy-plane and \((0, b)\) is the y-intercept. The slope, \(m\), can be calculated using two ordered pairs, \((x_1, y_1)\) and \((x_2, y_2)\), and the formula \(m=\frac{y_2-y_1}{x_2-x_1}\). Substituting the ordered pairs \((-6, 65)\) and \((6, 29)\) from the table for \((x_1, y_1)\) and \((x_2, y_2)\), respectively, in this formula yields \(m=\frac{29-65}{6-(-6)}\), which is equivalent to \(m=\frac{-36}{12}\), or \(m=-3\). Substituting \(-3\) for \(m\) in the formula \(y=mx+b\) yields \(y=-3x+b\). Substituting the point \((-6, 65)\) into this equation yields \(65=-3(-6)+b\), or \(65=18+b\). Subtracting \(18\) from both sides of this equation yields \(47=b\). Substituting \(47\) for \(b\) in the equation \(y=-3x+b\) yields \(y=-3x+47\). Adding \(3x\) to both sides of this equation yields \(3x+y=47\). Multiplying both sides of this equation by \(3\) yields \(9x+3y=141\).

Choice B is incorrect. Substituting the point \((-6, 65)\) from the table into this equation yields \(9(-6)+3(65)=3\), or \(141=3\), which is false.

Choice C is incorrect. Substituting the point \((-6, 65)\) from the table into this equation yields \(3(-6)+9(65)=141\), or \(567=141\), which is false.

Choice D is incorrect. Substituting the point \((-6, 65)\) from the table into this equation yields \(3(-6)+9(65)=3\), or \(567=3\), which is false.`,
  },
  {
    id: 'e0f59119', skill: S, type: 'spr', accepted: ['14.66', '14.67', '44/3'],
    prompt: R`What is the slope of the graph of \(y=\frac{1}{3}(29x+10)+5x\) in the xy-plane?`,
    explanation: R`The correct answer is \(\frac{44}{3}\). A linear equation can be written in the form \(y=mx+b\), where \(m\) is the slope of the graph of the equation in the xy-plane and \((0, b)\) is the y-intercept. Distributing the \(\frac{1}{3}\) in the equation \(y=\frac{1}{3}(29x+10)+5x\) yields \(y=\frac{29}{3}x+\frac{10}{3}+5x\). Combining like terms on the right-hand side of this equation yields \(y=\frac{44}{3}x+\frac{10}{3}\). This equation is in the form \(y=mx+b\), where \(m=\frac{44}{3}\) and \(b=\frac{10}{3}\). Therefore, the slope of the graph of the given equation in the xy-plane is \(\frac{44}{3}\). Note that 44/3, 14.66, and 14.67 are examples of ways to enter a correct answer.`,
  },
  {
    id: 'c307283c', skill: S, type: 'mcq', answer: 'C', image: IMG('c307283c'),
    prompt: 'What is an equation of the graph shown?',
    options: [R`\(y=-2x-8\)`, R`\(y=x-8\)`, R`\(y=-x-8\)`, R`\(y=2x-8\)`],
    explanation: R`Choice C is correct. An equation of a line can be written in the form \(y=mx+b\), where \(m\) is the slope of the line and \((0, b)\) is the y-intercept of the line. The line shown passes through the point \((0, -8)\), so \(b=-8\). The line shown also passes through the point \((-8, 0)\). The slope, \(m\), of a line passing through two points \((x_1, y_1)\) and \((x_2, y_2)\) can be calculated using the equation \(m=\frac{y_2-y_1}{x_2-x_1}\). For the points \((0, -8)\) and \((-8, 0)\), this gives \(m=\frac{(-8)-0}{0-(-8)}\), or \(m=-1\). Substituting \(-8\) for \(b\) and \(-1\) for \(m\) in \(y=mx+b\) yields \(y=(-1)x+(-8)\), or \(y=-x-8\). Therefore, an equation of the graph shown is \(y=-x-8\).

Choice A is incorrect. This is an equation of a line with a slope of \(-2\), not \(-1\).

Choice B is incorrect. This is an equation of a line with a slope of \(1\), not \(-1\).

Choice D is incorrect. This is an equation of a line with a slope of \(2\), not \(-1\).`,
  },
  {
    id: 'df78b361', skill: S, type: 'mcq', answer: 'C',
    prompt: R`Lily made \(36\) cups of jam. Lily then filled \(x\) small containers and \(y\) large containers with all the jam she made. The equation \(4x+6y=36\) represents this situation. Which is the best interpretation of \(6y\) in this context?`,
    options: [
      'The number of large containers Lily filled',
      'The number of small containers Lily filled',
      'The total number of cups of jam in the large containers',
      'The total number of cups of jam in the small containers',
    ],
    explanation: R`Choice C is correct. It's given that the equation \(4x+6y=36\) represents the situation where Lily filled \(x\) small containers and \(y\) large containers with all the jam she made, which was \(36\) cups. Therefore, \(6y\) represents the total number of cups of jam in the large containers.

Choice A is incorrect. The number of large containers Lily filled is represented by \(y\), not \(6y\).

Choice B is incorrect. The number of small containers Lily filled is represented by \(x\), not \(6y\).

Choice D is incorrect. The total number of cups of jam in the small containers is represented by \(4x\), not \(6y\).`,
  },
  {
    id: '0d1b1e35', skill: S, type: 'mcq', answer: 'A',
    prompt: R`A batch of banana milkshakes consists of \(4\) cups of ice cream and \(2\) bananas and has \(1{,}114\textbf{ milligrams (mg)}\) of calcium. There is \(276\text{ mg}\) of calcium in \(1\) cup of the ice cream used to make this batch of milkshakes. How much calcium, \(\textbf{in mg}\), is in \(1\) banana?`,
    options: [R`\(5\)`, R`\(10\)`, R`\(419\)`, R`\(1{,}104\)`],
    explanation: R`Choice A is correct. It's given that a batch of banana milkshakes consists of \(4\) cups of ice cream and \(2\) bananas and has \(1{,}114\) mg of calcium. It's also given that there is \(276\) mg of calcium in \(1\) cup of the ice cream used to make this batch of milkshakes. It follows that the total amount of calcium in \(4\) cups of ice cream is \(4(276)\), or \(1{,}104\) mg. Let \(x\) represent the amount of calcium, in mg, in \(1\) banana. It follows that the total amount of calcium in \(2\) bananas is \(2x\) mg. Since the batch of banana milkshakes has \(1{,}114\) mg of calcium, the equation \(1{,}104+2x=1{,}114\) represents this situation. Subtracting \(1{,}104\) from both sides of this equation yields \(2x=10\). Dividing both sides of this equation by \(2\) yields \(x=5\). Therefore, the amount of calcium in \(1\) banana is \(5\) mg.

Choice B is incorrect. This is the amount of calcium, in mg, in \(2\) bananas, not in \(1\) banana.

Choice C is incorrect and may result from conceptual or calculation errors.

Choice D is incorrect. This is the amount of calcium, in mg, in \(4\) cups of ice cream, not in \(1\) banana.`,
  },
  {
    id: 'd62ad380', skill: S, type: 'mcq', answer: 'C',
    prompt: R`An artist paints and sells square tiles. The selling price P, in dollars, of a painted tile is a linear function of the side length of the tile s, in inches, as shown in the table below.
\[\begin{array}{|c|c|}\hline \text{Side length, s (inches)} & \text{Price, P (dollars)}\\\hline 3 & 8.00\\\hline 6 & 18.00\\\hline 9 & 28.00\\\hline\end{array}\]
Which of the following could define the relationship between s and P ?`,
    options: [R`\(P=3s+10\)`, R`\(P=\dfrac{10}{3}s+8\)`, R`\(P=\dfrac{10}{3}s-2\)`, R`\(P=\dfrac{3}{10}s-\dfrac{1}{10}\)`],
    explanation: R`Choice C is correct. The relationship between s and P can be modeled by a linear equation of the form P = ks + a, where k and a are constants. The table shows that P increases by 10 when s increases by 3, so k = \(\frac{10}{3}\). To solve for a, substitute one of the given pairs of values for s and P: when s = 3, P = 8, so \(8=\frac{10}{3}(3)+a\), which yields a = –2. The solution is therefore \(P=\frac{10}{3}s-2\).

Choice A is incorrect. When s = 3, P = 8, but 3(3) + 10 = 19 ≠ 8. Choice B is incorrect. This may result from using the first number given for P in the table as the constant term a in the linear equation P = ks + a, which is true only when s = 0. Choice D is incorrect and may result from using the reciprocal of the slope of the line.`,
  },
  {
    id: '431c3038', skill: S, type: 'mcq', answer: 'D',
    prompt: 'In an article about exercise, it is estimated that a 160-pound adult uses 200 calories for every 30 minutes of hiking and 150 calories for every 30 minutes of bicycling. An adult who weighs 160 pounds has completed 1 hour of bicycling. Based on the article, how many hours should the adult hike to use a total of 1,900 calories from bicycling and hiking?',
    options: ['9.5', '8.75', '6', '4'],
    explanation: R`Choice D is correct. Since a 160-pound adult uses 200 calories for every 30 minutes of hiking, then the same adult uses \(200h\) calories after hiking for h 30-minute periods. Similarly, the same adult uses \(150b\) calories after bicycling for b 30-minute periods. Therefore, the equation \(200h+150b=1{,}900\) represents the situation where a 160-pound adult uses a total of 1,900 calories from hiking for h 30-minute periods and bicycling for b 30-minute periods. It's given that the adult completes 1 hour, or 2 30-minute periods, of bicycling. Substituting 2 for b in the equation \(200h+150b=1{,}900\) yields \(200h+150(2)=1{,}900\), or \(200h+300=1{,}900\). Subtracting 300 from both sides of this equation yields \(200h=1{,}600\). Dividing both sides by 200 yields \(h=8\). Since h represents the number of 30-minute periods spent hiking and there are 2 30-minute periods in every hour, it follows that the adult will need to hike for \(\frac{8}{2}\), or 4 hours to use a total of 1,900 calories from bicycling and hiking.

Choice A is incorrect and may result from solving the equation \(200h=1{,}900\). This represents 0 30-minute periods bicycling instead of 2. Choice B is incorrect and may result from solving the equation \(200h+150=1{,}900\). This represents 1 30-minute period of bicycling instead of 2. Choice C is incorrect. This may result from determining that the number of 30-minute periods the adult should hike is 8, but then subtracting 2 from 8, rather than dividing 8 by 2, to find the number of hours the adult should hike.`,
  },
  {
    id: '265f2a53', skill: S, type: 'mcq', answer: 'C',
    prompt: R`When line \(n\) is graphed in the xy-plane, it has an x-intercept of \((-4, 0)\) and a y-intercept of \(\left(0, \frac{86}{3}\right)\). What is the slope of line \(n\)?`,
    options: [R`\(\dfrac{3}{344}\)`, R`\(\dfrac{6}{43}\)`, R`\(\dfrac{43}{6}\)`, R`\(\dfrac{344}{3}\)`],
    explanation: R`Choice C is correct. It's given that when line \(n\) is graphed in the xy-plane, it has an x-intercept of \((-4, 0)\) and a y-intercept of \(\left(0, \frac{86}{3}\right)\). The slope, \(m\), of a line can be found using any two points on the line, \((x_1, y_1)\) and \((x_2, y_2)\), and the slope formula \(m=\frac{y_2-y_1}{x_2-x_1}\). Substituting the points \((-4, 0)\) and \(\left(0, \frac{86}{3}\right)\) for \((x_1, y_1)\) and \((x_2, y_2)\), respectively, in the slope formula yields \(m=\frac{\frac{86}{3}-0}{0-(-4)}\), or \(m=\frac{43}{6}\). Therefore, the slope of line \(n\) is \(\frac{43}{6}\).

Choice A is incorrect and may result from conceptual or calculation errors.

Choice B is incorrect. This is the slope of a line that has an x-intercept of \(\left(\frac{86}{3}, 0\right)\) and a y-intercept of \((0, -4)\).

Choice D is incorrect and may result from conceptual or calculation errors.`,
  },
  {
    id: 'c39dbbdf', skill: S, type: 'mcq', answer: 'B',
    prompt: R`Line \(r\) is defined by the equation \(4x-9y=3\). Line \(s\) is parallel to line \(r\) in the xy-plane. What is the slope of line \(s\)?`,
    options: [R`\(\dfrac{9}{4}\)`, R`\(\dfrac{4}{9}\)`, R`\(-4\)`, R`\(-9\)`],
    explanation: R`Choice B is correct. It's given that line \(s\) is parallel to line \(r\) in the xy-plane. This means that the slope of line \(r\) is equal to the slope of line \(s\). Line \(r\) is defined by the equation \(4x-9y=3\). This equation can be written in slope-intercept form \(y=mx+b\), where \(m\) represents the slope of the line and \(b\) represents the y-coordinate of the y-intercept of the line. Subtracting \(4x\) from both sides of the equation \(4x-9y=3\) yields \(-9y=-4x+3\). Dividing both sides of this equation by \(-9\) yields \(y=\frac{4}{9}x-\frac{1}{3}\). Therefore, the slope of line \(r\) is \(\frac{4}{9}\). Since parallel lines have equal slopes, the slope of line \(s\) is also \(\frac{4}{9}\).

Choice A is incorrect. This is the reciprocal of the slope of line \(s\), not the slope of line \(s\).` + '\n\n' + ce('C', 'D'),
  },
  {
    id: 'ca452900', skill: S, type: 'spr', accepted: ['.3846', '0.385', '0.384', '5/13'],
    prompt: R`What is the slope of the graph of \(y=\frac{5x}{13}-23\) in the xy-plane?`,
    explanation: R`The correct answer is \(\frac{5}{13}\). The graph of a line in the xy-plane can be represented by the equation \(y=mx+b\), where \(m\) is the slope of the line and \(b\) is the y-coordinate of the y-intercept. The given equation can be written as \(y=\left(\frac{5}{13}\right)x-23\). Therefore, the slope of the graph of this equation in the xy-plane is \(\frac{5}{13}\). Note that 5/13, .3846, 0.385, and 0.384 are examples of ways to enter a correct answer.`,
  },
  {
    id: '2e1a7f66', skill: S, type: 'mcq', answer: 'A',
    prompt: R`Figure A and figure B are both regular polygons. The sum of the perimeter of figure A and the perimeter of figure B is \(63\) inches. The equation \(3x+6y=63\) represents this situation, where \(x\) is the number of sides of figure A and \(y\) is the number of sides of figure B. Which statement is the best interpretation of \(6\) in this context?`,
    options: [
      R`Each side of figure B has a length of \(6\) inches.`,
      R`The number of sides of figure B is \(6\).`,
      R`Each side of figure A has a length of \(6\) inches.`,
      R`The number of sides of figure A is \(6\).`,
    ],
    explanation: R`Choice A is correct. It's given that figure A and figure B (not shown) are both regular polygons and the sum of the perimeters of the two figures is \(63\) inches. It's also given that \(x\) is the number of sides of figure A and \(y\) is the number of sides of figure B, and that the equation \(3x+6y=63\) represents this situation. Thus, \(3x\) and \(6y\) represent the perimeters, in inches, of figure A and figure B, respectively. Since \(6y\) represents the perimeter, in inches, of figure B and \(y\) is the number of sides of figure B, it follows that each side of figure B has a length of \(6\) inches.

Choice B is incorrect. The number of sides of figure B is \(y\), not \(6\).

Choice C is incorrect. Since the perimeter, in inches, of figure A is represented by \(3x\), each side of figure A has a length of \(3\) inches, not \(6\) inches.

Choice D is incorrect. The number of sides of figure A is \(x\), not \(6\).`,
  },
  {
    id: '038d87d7', skill: S, type: 'mcq', answer: 'A',
    prompt: R`A neighborhood consists of a \(2\)-hectare park and a \(35\)-hectare residential area. The total number of trees in the neighborhood is \(3{,}934\). The equation \(2x+35y=3{,}934\) represents this situation. Which of the following is the best interpretation of x in this context?`,
    options: [
      'The average number of trees per hectare in the park',
      'The average number of trees per hectare in the residential area',
      'The total number of trees in the park',
      'The total number of trees in the residential area',
    ],
    explanation: R`Choice A is correct. It's given that a neighborhood consists of a \(2\)-hectare park and a \(35\)-hectare residential area and that the total number of trees in the neighborhood is \(3{,}934\). It's also given that the equation \(2x+35y=3{,}934\) represents this situation. Since the total number of trees for a given area can be determined by taking the number of hectares times the average number of trees per hectare, this must mean that the terms \(2x\) and \(35y\) correspond to the number of trees in the park and in the residential area, respectively. Since \(2x\) corresponds to the number of trees in the park, and \(2\) is the size of the park, in hectares, \(x\) must represent the average number of trees per hectare in the park.` + '\n\n' + cerr('B', 'C', 'D'),
  },
  {
    id: '9ed4c1a2', skill: S, type: 'spr', accepted: ['13.75', '55/4'],
    prompt: R`What is the slope of the graph of \(y=\frac{1}{4}(27x+15)+7x\) in the xy-plane?`,
    explanation: R`The correct answer is \(\frac{55}{4}\). In the xy-plane, the graph of an equation in the form \(y=mx+b\), where \(m\) and \(b\) are constants, has a slope of \(m\) and a y-intercept of \((0, b)\). Applying the distributive property to the right-hand side of the given equation yields \(y=\frac{27}{4}x+\frac{15}{4}+7x\). Combining like terms yields \(y=\frac{55}{4}x+\frac{15}{4}\). This equation is in the form \(y=mx+b\), where \(m=\frac{55}{4}\) and \(b=\frac{15}{4}\). It follows that the slope of the graph of \(y=\frac{1}{4}(27x+15)+7x\) in the xy-plane is \(\frac{55}{4}\). Note that 55/4 and 13.75 are examples of ways to enter a correct answer.`,
  },
  {
    id: 'fb43b85f', skill: S, type: 'spr', accepted: ['1.636', '18/11'],
    prompt: R`A line passes through the points \((4, 6)\) and \((15, 24)\) in the xy-plane. What is the slope of the line?`,
    explanation: R`The correct answer is \(\frac{18}{11}\). For a line that passes through the points \((x_1, y_1)\) and \((x_2, y_2)\) in the xy-plane, the slope of the line can be calculated using the slope formula, \(m=\frac{y_2-y_1}{x_2-x_1}\). It's given that a line passes through the points \((4, 6)\) and \((15, 24)\) in the xy-plane. Substituting \((4, 6)\) for \((x_1, y_1)\) and \((15, 24)\) for \((x_2, y_2)\) in the slope formula, \(m=\frac{y_2-y_1}{x_2-x_1}\), yields \(m=\frac{24-6}{15-4}\), or \(m=\frac{18}{11}\). Therefore, the slope of the line is \(\frac{18}{11}\). Note that 18/11 and 1.636 are examples of ways to enter a correct answer.`,
  },
  {
    id: 'a4989860', skill: S, type: 'spr', accepted: ['9'],
    prompt: R`A line in the xy-plane has a slope of \(9\) and passes through the point \((0, -5)\). The equation \(y=px+r\) defines the line, where \(p\) and \(r\) are constants. What is the value of \(p\)?`,
    explanation: R`The correct answer is \(9\). It's given that the equation \(y=px+r\) defines the line. In this equation, \(p\) represents the slope of the line and \(r\) represents the y-coordinate of the y-intercept of the line. It's given that the line has a slope of \(9\). Therefore, the value of \(p\) is \(9\).`,
  },
  {
    id: '4722abd2', skill: S, type: 'mcq', answer: 'C',
    prompt: R`Line \(p\) is defined by \(2y+8x=11\). Line \(r\) is perpendicular to line \(p\) in the xy-plane. What is the slope of line \(r\)?`,
    options: [R`\(-4\)`, R`\(-\dfrac{1}{4}\)`, R`\(\dfrac{1}{4}\)`, R`\(4\)`],
    explanation: R`Choice C is correct. It's given that line \(p\) is defined by the equation \(2y+8x=11\). The equation can be written in slope-intercept form \(y=mx+b\), where \(m\) represents the slope of the line. Subtracting \(8x\) from both sides of the equation \(2y+8x=11\) yields \(2y=-8x+11\). Dividing both sides of this equation by \(2\) yields \(y=-4x+\frac{11}{2}\). Therefore, the slope of line \(p\) in the xy-plane is \(-4\). It's also given that line \(p\) is perpendicular to line \(r\). Perpendicular lines have slopes that are negative reciprocals of each other, so the slope of line \(r\) is \(-\frac{1}{(-4)}=\frac{1}{4}\).

Choice A is incorrect. This is the slope of line \(p\), not line \(r\).

Choice B is incorrect. This is the reciprocal, not the negative reciprocal, of the slope of line \(p\).

Choice D is incorrect. This is the negative, not the negative reciprocal, of the slope of line \(p\).`,
  },
  {
    id: '00b9bd37', skill: S, type: 'mcq', answer: 'B', image: IMG('00b9bd37'),
    prompt: R`The graph models the relationship between the number of T-shirts, \(x\), and the number of sweatshirts, \(y\), that Kira can purchase for a school fundraiser. Which equation could represent this relationship?`,
    options: [R`\(y=7x+18\)`, R`\(7x+18y=630\)`, R`\(y=18x+7\)`, R`\(18x+7y=630\)`],
    explanation: R`Choice B is correct. A line in the xy-plane can be written as \(y=mx+b\), where \(m\) is the slope of the line and \(b\) is the y-coordinate of the y-intercept. The graph shown is a line passing through the points \((0, 35)\) and \((90, 0)\). Substituting \(0\) for \(x\) and \(35\) for \(y\) in the equation \(y=mx+b\) yields \(35=m(0)+b\), or \(35=b\). Substituting \(35\) for \(b\), \(90\) for \(x\), and \(0\) for \(y\) in the equation \(y=mx+b\) yields \(0=90m+35\). Subtracting \(35\) from both sides of this equation yields \(-35=90m\). Dividing both sides of this equation by \(90\) yields \(-\frac{35}{90}=m\), or \(-\frac{7}{18}=m\). Substituting \(-\frac{7}{18}\) for \(m\) and \(35\) for \(b\) in the equation \(y=mx+b\) yields \(y=-\frac{7}{18}x+35\). Multiplying both sides of this equation by \(18\) yields \(18y=-7x+35(18)\), or \(18y=-7x+630\). Adding \(7x\) to both sides of this equation yields \(7x+18y=630\). Therefore, the equation \(7x+18y=630\) represents the relationship between \(x\) and \(y\) modeled by the graph.

Choice A is incorrect. The point \((0, 35)\) is not on the graph of this equation, since \(7(0)+18=18\), not \(35\).

Choice C is incorrect. The point \((0, 35)\) is not on the graph of this equation, since \(18(0)+7=7\), not \(35\).

Choice D is incorrect. The point \((90, 0)\) is not on the graph of this equation, since \(18(90)+7(0)=1{,}620\), not \(630\).`,
  },
];
