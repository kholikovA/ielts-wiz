// Linear inequalities in one or two variables (16) + systems of two linear equations in two variables (20).
import { ce, cerr } from './q1.mjs';

const R = String.raw;
const I = 'Linear inequalities in one or two variables';
const SY = 'Systems of two linear equations in two variables';
const IMG = (id) => `/hub/visuals/sat/${id}.png`;
const sys = (a, b) => `\\(\\begin{gathered}${a}\\\\${b}\\end{gathered}\\)`;
const tbl = (ys) => `\\(\\begin{array}{|c|c|}\\hline x & y\\\\\\hline 3 & ${ys[0]}\\\\\\hline 5 & ${ys[1]}\\\\\\hline 8 & ${ys[2]}\\\\\\hline\\end{array}\\)`;

export default [
  {
    id: 'f224df07', skill: I, type: 'mcq', answer: 'C',
    prompt: 'A cargo helicopter delivers only 100-pound packages and 120-pound packages. For each delivery trip, the helicopter must carry at least 10 packages, and the total weight of the packages can be at most 1,100 pounds. What is the maximum number of 120-pound packages that the helicopter can carry per trip?',
    options: ['2', '4', '5', '6'],
    explanation: R`Choice C is correct. Let a equal the number of 120-pound packages, and let b equal the number of 100-pound packages. It's given that the total weight of the packages can be at most 1,100 pounds: the inequality \(120a+100b\le 1{,}100\) represents this situation. It's also given that the helicopter must carry at least 10 packages: the inequality \(a+b\ge 10\) represents this situation. Values of a and b that satisfy these two inequalities represent the allowable numbers of 120-pound packages and 100-pound packages the helicopter can transport. To maximize the number of 120-pound packages, a, in the helicopter, the number of 100-pound packages, b, in the helicopter needs to be minimized. Expressing b in terms of a in the second inequality yields \(b\ge 10-a\), so the minimum value of b is equal to \(10-a\). Substituting \(10-a\) for b in the first inequality results in \(120a+100(10-a)\le 1{,}100\). Using the distributive property to rewrite this inequality yields \(120a+1{,}000-100a\le 1{,}100\), or \(20a+1{,}000\le 1{,}100\). Subtracting 1,000 from both sides of this inequality yields \(20a\le 100\). Dividing both sides of this inequality by 20 results in \(a\le 5\). This means that the maximum number of 120-pound packages that the helicopter can carry per trip is 5.

Choices A, B, and D are incorrect and may result from incorrectly creating or solving the system of inequalities.`,
  },
  {
    id: '64c85440', skill: I, type: 'mcq', answer: 'D',
    prompt: 'In North America, the standard width of a parking space is at least 7.5 feet and no more than 9.0 feet. A restaurant owner recently resurfaced the restaurant’s parking lot and wants to determine the number of parking spaces, n, in the parking lot that could be placed perpendicular to a curb that is 135 feet long, based on the standard width of a parking space. Which of the following describes all the possible values of n ?',
    options: [R`\(18\le n\le 135\)`, R`\(7.5\le n\le 9\)`, R`\(15\le n\le 135\)`, R`\(15\le n\le 18\)`],
    explanation: R`Choice D is correct. Placing the parking spaces with the minimum width of 7.5 feet gives the maximum possible number of parking spaces. Thus, the maximum number that can be placed perpendicular to a 135-foot-long curb is \(\frac{135}{7.5}=18\). Placing the parking spaces with the maximum width of 9 feet gives the minimum number of parking spaces. Thus, the minimum number that can be placed perpendicular to a 135-foot-long curb is \(\frac{135}{9}=15\). Therefore, if n is the number of parking spaces in the lot, the range of possible values for n is \(15\le n\le 18\).

Choices A and C are incorrect. These choices equate the length of the curb with the maximum possible number of parking spaces. Choice B is incorrect. This is the range of possible values for the width of a parking space instead of the range of possible values for the number of parking spaces.`,
  },
  {
    id: '968e9e51', skill: I, type: 'mcq', answer: 'D',
    prompt: R`\[\begin{gathered} y\le x\\ y\le -x\end{gathered}\]
Which of the following ordered pairs \((x, y)\) is a solution to the system of inequalities above?`,
    options: [R`\((1, 0)\)`, R`\((-1, 0)\)`, R`\((0, 1)\)`, R`\((0, -1)\)`],
    explanation: R`Choice D is correct. The solutions to the given system of inequalities is the set of all ordered pairs \((x, y)\) that satisfy both inequalities in the system. For an ordered pair to satisfy the inequality \(y\le x\), the value of the ordered pair's y-coordinate must be less than or equal to the value of the ordered pair's x-coordinate. This is true of the ordered pair \((0, -1)\), because \(-1\le 0\). To satisfy the inequality \(y\le -x\), the value of the ordered pair's y-coordinate must be less than or equal to the value of the additive inverse of the ordered pair's x-coordinate. This is also true of the ordered pair \((0, -1)\). Because 0 is its own additive inverse, \(-1\le -(0)\) is the same as \(-1\le 0\). Therefore, the ordered pair \((0, -1)\) is a solution to the given system of inequalities.

Choice A is incorrect. This ordered pair satisfies only the inequality \(y\le x\) in the given system, not both inequalities. Choice B incorrect. This ordered pair satisfies only the inequality \(y\le -x\) in the system, but not both inequalities. Choice C is incorrect. This ordered pair satisfies neither inequality.`,
  },
  {
    id: '30b1e186', skill: I, type: 'mcq', answer: 'D',
    prompt: R`In the xy-plane, which of the following does NOT contain any points that are part of the solution set to \(5x-7y>35\)?`,
    options: ['The x-axis', R`The region where \(x>0\) and \(y>0\)`, R`The region where \(x<0\) and \(y<0\)`, R`The region where \(x<0\) and \(y>0\)`],
    explanation: R`Choice D is correct. It's given that the solution set consists of points in the xy-plane where \(5x-7y>35\), which can also be written as \(5x+(-7y)>35\). If \((x, y)\) is a point in the region where \(x<0\) and \(y>0\), then \(x\) is a negative number and \(y\) is a positive number. If \(x\) is a negative number, then the value of \(5x\) is a negative number. If \(y\) is a positive number, then the value of \(-7y\) is a negative number. It follows that the expression \(5x+(-7y)\) is the sum of two negative numbers and is therefore negative. If the value of \(5x+(-7y)\) is negative, then the value of \(5x+(-7y)\) cannot be greater than \(35\). Thus, the region where \(x<0\) and \(y>0\) does not contain any points that are part of the solution set to \(5x-7y>35\).

Choice A is incorrect. The x-axis contains the point \((10, 0)\), which is part of the solution set to \(5x-7y>35\), since \(5(10)-7(0)>35\), or \(50>35\), is true.

Choice B is incorrect. The region where \(x>0\) and \(y>0\) contains the point \((10, 1)\), which is part of the solution set to \(5x-7y>35\), since \(5(10)-7(1)>35\), or \(43>35\), is true.

Choice C is incorrect. The region where \(x<0\) and \(y<0\) contains the point \((-1, -10)\), which is part of the solution set to \(5x-7y>35\), since \(5(-1)-7(-10)>35\), or \(65>35\), is true.`,
  },
  {
    id: 'd914abec', skill: I, type: 'mcq', answer: 'D',
    prompt: R`To complete a landscaping project, Adam charges a fee of \(\$20.00\) for his equipment and \(\$9.50\) per hour spent working on the project. To complete this same landscaping project, Caroline charges a fee of \(\$17.00\) for her equipment and \(\$10.00\) per hour spent working on the project. If \(x\) represents the number of hours spent working on the landscaping project, what are all the values of \(x\) for which Caroline's total charge is greater than Adam's total charge?`,
    options: [R`\(5\le x\le 6\)`, R`\(6\le x\le 7\)`, R`\(x<5\)`, R`\(x>6\)`],
    explanation: R`Choice D is correct. It's given that Adam charges a fee of \(\$20.00\) for his equipment and \(\$9.50\) per hour spent working on the project. For \(x\) hours spent working on the project, it follows that Adam's total charge, in dollars, is \(20.00+9.50x\). It's also given that Caroline charges a fee of \(\$17.00\) for her equipment and \(\$10.00\) per hour spent working on the project. For \(x\) hours spent working on the project, it follows that Caroline's total charge, in dollars, is \(17.00+10.00x\). Therefore, if \(x\) represents the number of hours spent working on the landscaping project, then Caroline's total charge is greater than Adam's total charge if \(17.00+10.00x>20.00+9.50x\), or \(17+10x>20+9.5x\). Subtracting \(9.5x\) from both sides of this inequality yields \(17+0.5x>20\). Subtracting \(17\) from both sides of this inequality yields \(0.5x>3\). Dividing both sides of this inequality by \(0.5\) yields \(x>6\).

Choice A is incorrect. For example, if \(x=5\), then Caroline's total charge, in dollars, would be \(17.00+10.00(5)\), or \(67\), and Adam's total charge, in dollars, would be \(20.00+9.50(5)\), or \(67.50\). Since Caroline's total charge would be less than Adam's total charge, \(5\) can't be a possible value of \(x\).

Choice B is incorrect. For example, if \(x=6\), then Caroline's total charge, in dollars, would be \(17.00+10.00(6)\), or \(77\), and Adam's total charge, in dollars, would be \(20.00+9.50(6)\), or \(77\). Since Caroline's total charge would be equal to Adam's total charge, \(6\) can't be a possible value of \(x\).

Choice C is incorrect. For example, if \(x=4\), then Caroline's total charge, in dollars, would be \(17.00+10.00(4)\), or \(57\), and Adam's total charge, in dollars, would be \(20.00+9.50(4)\), or \(58\). Since Caroline's total charge would be less than Adam's total charge, \(4\) can't be a possible value of \(x\).`,
  },
  {
    id: 'bf5f80c6', skill: I, type: 'mcq', answer: 'A',
    prompt: R`\[y<-4x+4\]
Which point \((x, y)\) is a solution to the given inequality in the \(xy\)-plane?`,
    options: [R`\((-4, 0)\)`, R`\((0, 5)\)`, R`\((2, 1)\)`, R`\((2, -1)\)`],
    explanation: R`Choice D is correct. For a point \((x, y)\) to be a solution to the given inequality in the xy-plane, the value of the point's y-coordinate must be less than the value of \(-4x+4\), where \(x\) is the value of the x-coordinate of the point. This is true of the point \((-4, 0)\) because \(0<-4(-4)+4\), or \(0<20\). Therefore, the point \((-4, 0)\) is a solution to the given inequality.

Choices A, B, and C are incorrect. None of these points are a solution to the given inequality because each point's y-coordinate is greater than the value of \(-4x+4\) for the point's x-coordinate.

Note: the official explanation above says "Choice D", but the correct answer is A, \((-4, 0)\), as its working shows. Choices B, C, and D are the incorrect ones.`,
  },
  {
    id: '80da233d', skill: I, type: 'mcq', answer: 'D',
    prompt: 'A certain elephant weighs 200 pounds at birth and gains more than 2 but less than 3 pounds per day during its first year. Which of the following inequalities represents all possible weights w, in pounds, for the elephant 365 days after birth?',
    options: [R`\(400<w<600\)`, R`\(565<w<930\)`, R`\(730<w<1{,}095\)`, R`\(930<w<1{,}295\)`],
    explanation: R`Choice D is correct. It's given that the elephant weighs 200 pounds at birth and gains more than 2 pounds but less than 3 pounds per day during its first year. The inequality \(200+2d<w<200+3d\) represents this situation, where d is the number of days after birth. Substituting 365 for d in the inequality gives \(200+2(365)<w<200+3(365)\), or \(930<w<1{,}295\).

Choice A is incorrect and may result from solving the inequality \(200(2)<w<200(3)\). Choice B is incorrect and may result from solving the inequality for a weight range of more than 1 pound but less than 2 pounds: \(200+1(365)<w<200+2(365)\). Choice C is incorrect and may result from calculating the possible weight gained by the elephant during the first year without adding the 200 pounds the elephant weighed at birth.`,
  },
  {
    id: 'b31c3117', skill: I, type: 'mcq', answer: 'A',
    prompt: R`\[H=120p+60\]
The Karvonen formula above shows the relationship between Alice's target heart rate H, in beats per minute (bpm), and the intensity level p of different activities. When \(p=0\), Alice has a resting heart rate. When \(p=1\), Alice has her maximum heart rate. It is recommended that p be between 0.5 and 0.85 for Alice when she trains. Which of the following inequalities describes Alice's target training heart rate?`,
    options: [R`\(120\le H\le 162\)`, R`\(102\le H\le 120\)`, R`\(60\le H\le 162\)`, R`\(60\le H\le 102\)`],
    explanation: R`Choice A is correct. When Alice trains, it's recommended that p be between 0.5 and 0.85. Therefore, her target training heart rate is represented by the values of H corresponding to \(0.5\le p\le 0.85\). When \(p=0.5\), \(H=120(0.5)+60\), or \(H=120\). When \(p=0.85\), \(H=120(0.85)+60\), or \(H=162\). Therefore, the inequality that describes Alice's target training heart rate is \(120\le H\le 162\).

Choice B is incorrect. This inequality describes Alice's target heart rate for \(0.35\le p\le 0.5\). Choice C is incorrect. This inequality describes her target heart rate for \(0\le p\le 0.85\). Choice D is incorrect. This inequality describes her target heart rate for \(0\le p\le 0.35\).`,
  },
  {
    id: '6cb9bf45', skill: I, type: 'mcq', answer: 'D',
    prompt: R`\[y>7x-4\]
For which of the following tables are all the values of \(x\) and their corresponding values of \(y\) solutions to the given inequality?`,
    options: [tbl([13, 27, 48]), tbl([17, 31, 52]), tbl([21, 27, 52]), tbl([21, 35, 56])],
    explanation: R`Choice D is correct. A solution \((x, y)\) to the given inequality is a value of \(x\) and the corresponding value of \(y\) such that the value of \(y\) is greater than the value of \(7x-4\). All the tables in the choices have the same three values of \(x\), so each of the three values of \(x\) can be substituted in the given inequality to compare the corresponding values of \(y\) in each of the tables. Substituting \(3\) for \(x\) in the given inequality yields \(y>7(3)-4\), or \(y>17\). Substituting \(5\) for \(x\) in the given inequality yields \(y>7(5)-4\), or \(y>31\). Substituting \(8\) for \(x\) in the given inequality yields \(y>7(8)-4\), or \(y>52\). Therefore, when \(x=3\), \(x=5\), and \(x=8\), the corresponding values of \(y\) must be greater than \(17\), greater than \(31\), and greater than \(52\), respectively. In the table in choice D, when \(x=3\), the corresponding value of \(y\) is \(21\), which is greater than \(17\); when \(x=5\), the corresponding value of \(y\) is \(35\), which is greater than \(31\); when \(x=8\), the corresponding value of \(y\) is \(56\), which is greater than \(52\). Of the given choices, only choice D gives values of \(x\) and their corresponding values of \(y\) that are all solutions to the given inequality.` + '\n\n' + ce('A', 'B', 'C'),
  },
  {
    id: '0ef4a7b6', skill: I, type: 'mcq', answer: 'A',
    prompt: R`A particular botanist classifies a species of plant as tall if its typical height when fully grown is more than \(100\) centimeters. Each of the following inequalities represents the possible heights \(h\), in centimeters, for a specific plant species when fully grown. Which inequality represents the possible heights \(h\), in centimeters, for a tall plant species?`,
    options: [R`\(106<h<158\)`, R`\(80<h<100\)`, R`\(42<h<87\)`, R`\(17<h<85\)`],
    explanation: R`Choice A is correct. It's given that a particular botanist classifies a species of plant as tall if its typical height when fully grown is more than \(100\) centimeters. The inequality \(106<h<158\) represents possible heights \(h\), in centimeters, for a plant species when fully grown where \(h\) is between \(106\) and \(158\) centimeters. Since all values of \(h\) in this inequality are greater than \(100\) centimeters, this inequality represents the possible heights for a tall plant species.

Choice B is incorrect. This inequality represents possible heights \(h\), in centimeters, for a plant species when fully grown where \(h\) is between \(80\) and \(100\) centimeters, not more than \(100\) centimeters.

Choice C is incorrect. This inequality represents possible heights \(h\), in centimeters, for a plant species when fully grown where \(h\) is between \(42\) and \(87\) centimeters, not more than \(100\) centimeters.

Choice D is incorrect. This inequality represents possible heights \(h\), in centimeters, for a plant species when fully grown where \(h\) is between \(17\) and \(85\) centimeters, not more than \(100\) centimeters.`,
  },
  {
    id: '6daf8d70', skill: I, type: 'mcq', answer: 'D',
    prompt: R`A city employee will plant two types of bushes, azaleas and boxwoods, in a park. There will be no more than \(164\) total bushes planted, and the number of azaleas planted will be at most three times the number of boxwoods planted. Which of the following systems of inequalities best represents this situation, where \(a\) is the number of azaleas that will be planted, and \(b\) is the number of boxwoods that will be planted?`,
    options: [sys('a+b\\ge 164', '3a\\ge b'), sys('a+b\\ge 164', 'a\\le 3b'), sys('a+b\\le 164', '3a\\ge b'), sys('a+b\\le 164', 'a\\le 3b')],
    explanation: R`Choice D is correct. It's given that a city employee will plant azaleas and boxwoods in a park, where \(a\) is the number of azaleas that will be planted and \(b\) is the number of boxwoods that will be planted. It's also given that there will be no more than \(164\) total bushes planted, which can be represented by the inequality \(a+b\le 164\). It's also given that the number of azaleas planted will be at most three times the number of boxwoods planted, which can be represented by the inequality \(a\le 3b\). Therefore, the system of inequalities containing \(a+b\le 164\) and \(a\le 3b\) best represents this situation.

Choice A is incorrect. The inequality \(a+b\ge 164\) represents a situation where at least \(164\) total bushes will be planted, not that there will be no more than \(164\) total bushes planted. Also, the inequality \(3a\ge b\) represents a situation where the number of boxwoods that will be planted is at most three times the number of azaleas that will be planted, not that the number of azaleas planted will be at most three times the number of boxwoods planted.

Choice B is incorrect. The inequality \(a+b\ge 164\) represents a situation where at least \(164\) total bushes will be planted, not that there will be no more than \(164\) total bushes planted.

Choice C is incorrect. The inequality \(3a\ge b\) represents a situation where the number of boxwoods that will be planted is at most three times the number of azaleas that will be planted, not that the number of azaleas planted will be at most three times the number of boxwoods planted.`,
  },
  {
    id: 'e8fd6d99', skill: I, type: 'mcq', answer: 'D',
    prompt: R`Terry has a goal to collect at least \(16\) items per week for a donation drive. This week, Terry has collected \(4\) items. If \(x\) represents the additional number of items Terry needs to collect this week to meet the goal, which inequality represents this situation?`,
    options: [R`\(4-x\le 16\)`, R`\(4+x\le 16\)`, R`\(4-x\ge 16\)`, R`\(4+x\ge 16\)`],
    explanation: R`Choice D is correct. It's given that this week, Terry has collected \(4\) items. It follows that the expression \(4+x\) represents the total number of items Terry will have collected after collecting \(x\) additional items. It's also given that Terry's goal is to collect at least \(16\) items per week. Therefore, the inequality \(4+x\ge 16\) represents this situation.

Choice A is incorrect and may result from conceptual or calculation errors.

Choice B is incorrect. This inequality represents a situation where the goal is to collect at most, not at least, \(16\) items per week.

Choice C is incorrect and may result from conceptual or calculation errors.`,
  },
  {
    id: '74c98c82', skill: I, type: 'spr', accepted: ['16'],
    prompt: R`An event planner is planning a party. It costs the event planner a onetime fee of \(\$35\) to rent the venue and \(\$10.25\) per attendee. The event planner has a budget of \(\$200\). What is the greatest number of attendees possible without exceeding the budget?`,
    explanation: R`The correct answer is \(16\). The total cost of the party is found by adding the onetime fee of the venue to the cost per attendee times the number of attendees. Let \(x\) be the number of attendees. The expression \(35+10.25x\) thus represents the total cost of the party. It's given that the budget is \(\$200\), so this situation can be represented by the inequality \(35+10.25x\le 200\). The greatest number of attendees can be found by solving this inequality for \(x\). Subtracting \(35\) from both sides of this inequality gives \(10.25x\le 165\). Dividing both sides of this inequality by \(10.25\) results in approximately \(x\le 16.098\). Since the question is stated in terms of attendees, rounding \(x\) down to the nearest whole number, \(16\), gives the greatest number of attendees possible.`,
  },
  {
    id: 'e9ef0e6b', skill: I, type: 'mcq', answer: 'B',
    prompt: R`A model estimates that whales from the genus Eschrichtius travel \(72\) to \(77\) miles in the ocean each day during their migration. Based on this model, which inequality represents the estimated total number of miles, \(x\), a whale from the genus Eschrichtius could travel in \(16\) days of its migration?`,
    options: [R`\(72+16\le x\le 77+16\)`, R`\((72)(16)\le x\le (77)(16)\)`, R`\(72\le 16+x\le 77\)`, R`\(72\le 16x\le 77\)`],
    explanation: R`Choice B is correct. It's given that the model estimates that whales from the genus Eschrichtius travel \(72\) to \(77\) miles in the ocean each day during their migration. If one of these whales travels \(72\) miles each day for \(16\) days, then the whale travels \(72(16)\) miles total. If one of these whales travels \(77\) miles each day for \(16\) days, then the whale travels \(77(16)\) miles total. Therefore, the model estimates that in \(16\) days of its migration, a whale from the genus Eschrichtius could travel at least \(72(16)\) and at most \(77(16)\) miles total. Thus, the inequality \((72)(16)\le x\le (77)(16)\) represents the estimated total number of miles, \(x\), a whale from the genus Eschrichtius could travel in \(16\) days of its migration.` + '\n\n' + cerr('A', 'C', 'D'),
  },
  {
    id: '90bd9ef8', skill: I, type: 'mcq', answer: 'B',
    prompt: 'The average annual energy cost for a certain home is $4,334. The homeowner plans to spend $25,000 to install a geothermal heating system. The homeowner estimates that the average annual energy cost will then be $2,712. Which of the following inequalities can be solved to find t, the number of years after installation at which the total amount of energy cost savings will exceed the installation cost?',
    options: [R`\(25{,}000>(4{,}334-2{,}712)t\)`, R`\(25{,}000<(4{,}334-2{,}712)t\)`, R`\(25{,}000-4{,}334>2{,}712t\)`, R`\(25{,}000>\dfrac{4{,}332}{2{,}712}t\)`],
    explanation: R`Choice B is correct. The savings each year from installing the geothermal heating system will be the average annual energy cost for the home before the geothermal heating system installation minus the average annual energy cost after the geothermal heating system installation, which is \((4{,}334-2{,}712)\) dollars. In t years, the savings will be \((4{,}334-2{,}712)t\) dollars. Therefore, the inequality that can be solved to find the number of years after installation at which the total amount of energy cost savings will exceed (be greater than) the installation cost, $25,000, is \(25{,}000<(4{,}334-2{,}712)t\).

Choice A is incorrect. It gives the number of years after installation at which the total amount of energy cost savings will be less than the installation cost. Choice C is incorrect and may result from subtracting the average annual energy cost for the home from the onetime cost of the geothermal heating system installation. To find the predicted total savings, the predicted average cost should be subtracted from the average annual energy cost before the installation, and the result should be multiplied by the number of years, t. Choice D is incorrect and may result from misunderstanding the context. The ratio \(\frac{4{,}332}{2{,}712}\) compares the average energy cost before installation and the average energy cost after installation; it does not represent the savings.`,
  },
  {
    id: '948087f2', skill: I, type: 'mcq', answer: 'D',
    prompt: R`\[\begin{array}{|l|}\hline y\le 3x+1\\\hline x-y>1\\\hline\end{array}\]
Which of the following ordered pairs (x, y) satisfies the system of inequalities above?`,
    options: [R`\((-2, -1)\)`, R`\((-1, 3)\)`, R`\((1, 5)\)`, R`\((2, -1)\)`],
    explanation: R`Choice D is correct. Any point (x, y) that is a solution to the given system of inequalities must satisfy both inequalities in the system. The second inequality in the system can be rewritten as \(x>y+1\). Of the given answer choices, only choice D satisfies this inequality, because inequality \(2>-1+1\) is a true statement. The point \((2, -1)\) also satisfies the first inequality.

Alternate approach: Substituting \((2, -1)\) into the first inequality gives \(-1\le 3(2)+1\), or \(-1\le 7\), which is a true statement. Substituting \((2, -1)\) into the second inequality gives \(2-(-1)>1\), or \(3>1\), which is a true statement. Therefore, since \((2, -1)\) satisfies both inequalities, it is a solution to the system.

Choice A is incorrect because substituting −2 for x and −1 for y in the first inequality gives \(-1\le 3(-2)+1\), or \(-1\le -5\), which is false. Choice B is incorrect because substituting −1 for x and 3 for y in the first inequality gives \(3\le 3(-1)+1\), or \(3\le -2\), which is false. Choice C is incorrect because substituting 1 for x and 5 for y in the first inequality gives \(5\le 3(1)+1\), or \(5\le 4\), which is false.`,
  },

  // ── Systems of two linear equations in two variables ──
  {
    id: 'cb8f449f', skill: SY, type: 'mcq', answer: 'D',
    prompt: R`\[\begin{array}{|l|}\hline \frac{1}{2}y=4\\[4pt]\hline x-\frac{1}{2}y=2\\[4pt]\hline\end{array}\]
The system of equations above has solution (x, y). What is the value of x ?`,
    options: ['3', R`\(\dfrac{7}{2}\)`, '4', '6'],
    explanation: R`Choice D is correct. Adding the corresponding sides of the two equations eliminates y and yields \(x=6\), as shown.
\[\begin{array}{r} \frac{1}{2}y=4\\ x-\frac{1}{2}y=2\\ \hline x+0=6\end{array}\]
If (x, y) is a solution to the system, then (x, y) satisfies both equations in the system and any equation derived from them. Therefore, \(x=6\).

Choices A, B, and C are incorrect and may be the result of errors when solving the system.`,
  },
  {
    id: 'e142f83c', skill: SY, type: 'mcq', answer: 'B',
    prompt: R`\[\begin{gathered} y-6=\frac{4}{5}(x+5)\\ y-v=\frac{4}{5}(x+10)\end{gathered}\]
In the given system of equations, \(v\) is a constant. The system has infinitely many solutions. What is the value of \(v\)?`,
    options: [R`\(0\)`, R`\(2\)`, R`\(4\)`, R`\(12\)`],
    explanation: R`Choice B is correct. It's given that the system has infinitely many solutions. A system of two linear equations has infinitely many solutions when the two linear equations are equivalent. Adding \(6\) to both sides of \(y-6=\frac{4}{5}(x+5)\) yields \(y=\frac{4}{5}(x+5)+6\). Applying the distributive property to this equation yields \(y=\frac{4}{5}x+\frac{20}{5}+6\), or \(y=\frac{4}{5}x+10\). Adding \(v\) to both sides of \(y-v=\frac{4}{5}(x+10)\) yields \(y=\frac{4}{5}(x+10)+v\). Applying the distributive property to this equation yields \(y=\frac{4}{5}x+\frac{40}{5}+v\), or \(y=\frac{4}{5}x+8+v\). For the equations \(y=\frac{4}{5}x+10\) and \(y=\frac{4}{5}x+8+v\) to be equivalent, it follows that \(10=8+v\). Subtracting \(8\) from both sides of this equation yields \(2=v\). Therefore, the value of \(v\) is \(2\).

Choice A is incorrect. If \(v=0\), the system of equations would have no solution, not infinitely many solutions.

Choice C is incorrect. If \(v=4\), the system of equations would have no solution, not infinitely many solutions.

Choice D is incorrect. If \(v=12\), the system of equations would have no solution, not infinitely many solutions.`,
  },
  {
    id: '0dd6227f', skill: SY, type: 'mcq', answer: 'B',
    prompt: R`At how many points do the graphs of the equations \(y=x+20\) and \(y=8x\) intersect in the xy-plane?`,
    options: [R`\(0\)`, R`\(1\)`, R`\(2\)`, R`\(8\)`],
    explanation: R`Choice B is correct. Each given equation is written in slope-intercept form, \(y=mx+b\), where \(m\) is the slope and \((0, b)\) is the y-intercept of the graph of the equation in the xy-plane. The graphs of two lines that have different slopes will intersect at exactly one point. The graph of the first equation is a line with slope \(1\). The graph of the second equation is a line with slope \(8\). Since the graphs are lines with different slopes, they will intersect at exactly one point.

Choice A is incorrect because two graphs of linear equations have \(0\) intersection points only if they are parallel and therefore have the same slope.

Choice C is incorrect because two graphs of linear equations in the xy-plane can have only \(0\), \(1\), or infinitely many points of intersection.

Choice D is incorrect because two graphs of linear equations in the xy-plane can have only \(0\), \(1\), or infinitely many points of intersection.`,
  },
  {
    id: '7efe5495', skill: SY, type: 'mcq', answer: 'C',
    prompt: R`\[\begin{gathered} y=3x\\ 2x+y=12\end{gathered}\]
The solution to the given system of equations is \((x, y)\). What is the value of \(5x\)?`,
    options: [R`\(24\)`, R`\(15\)`, R`\(12\)`, R`\(5\)`],
    explanation: R`Choice C is correct. It's given by the first equation in the system that \(y=3x\). Substituting \(3x\) for \(y\) in the equation \(2x+y=12\) yields \(2x+3x=12\), or \(5x=12\).` + '\n\n' + ce('A', 'B', 'D'),
  },
  {
    id: '71189542', skill: SY, type: 'mcq', answer: 'C',
    prompt: 'A group of 202 people went on an overnight camping trip, taking 60 tents with them. Some of the tents held 2 people each, and the rest held 4 people each. Assuming all the tents were filled to capacity and every person got to sleep in a tent, exactly how many of the tents were 2-person tents?',
    options: ['30', '20', '19', '18'],
    explanation: R`Choice C is correct. Let x represent the number of 2-person tents and let y represent the number of 4-person tents. It is given that the total number of tents was 60 and the total number of people in the group was 202. This situation can be expressed as a system of two equations, \(x+y=60\) and \(2x+4y=202\). The first equation can be rewritten as \(y=-x+60\). Substituting \(-x+60\) for y in the equation \(2x+4y=202\) yields \(2x+4(-x+60)=202\). Distributing and combining like terms gives \(-2x+240=202\). Subtracting 240 from both sides of \(-2x+240=202\) and then dividing both sides by \(-2\) gives \(x=19\). Therefore, the number of 2-person tents is 19.

Alternate approach: If each of the 60 tents held 4 people, the total number of people that could be accommodated in tents would be 240. However, the actual number of people who slept in tents was 202. The difference of 38 accounts for the 2-person tents. Since each of these tents holds 2 people fewer than a 4-person tent, \(\frac{38}{2}=19\) gives the number of 2-person tents.

Choice A is incorrect. This choice may result from assuming exactly half of the tents hold 2 people. If that were true, then the total number of people who slept in tents would be \(2(30)+4(30)=180\); however, the total number of people who slept in tents was 202, not 180. Choice B is incorrect. If 20 tents were 2-person tents, then the remaining 40 tents would be 4-person tents. Since all the tents were filled to capacity, the total number of people who slept in tents would be \(2(20)+4(40)=40+160=200\); however, the total number of people who slept in tents was 202, not 200. Choice D is incorrect. If 18 tents were 2-person tents, then the remaining 42 tents would be 4-person tents. Since all the tents were filled to capacity, the total number of people who slept in tents would be \(2(18)+4(42)=36+168=204\); however, the total number of people who slept in tents was 202, not 204.`,
  },
  {
    id: '6e6a3241', skill: SY, type: 'mcq', answer: 'C',
    prompt: R`\[\begin{gathered} x+5y=5\\ 2x-y=-4\end{gathered}\]
Which of the following graphs in the xy-plane could be used to solve the system of equations above?`,
    options: ['A', 'B', 'C', 'D'].map((l) => `![Graph ${l}](${IMG(`6e6a3241-${l}`)})`),
    explanation: R`Choice C is correct. The graph of a system of equations is the graph that shows the lines represented by each of the equations in the system. The x-intercept of the graph of each given equation can be found by substituting 0 for y in each equation: \(x+5(0)=5\), or \(x=5\), and \(2x-0=-4\), or \(x=-2\). The y-intercept of the graph of each equation can be found by substituting 0 for x in each equation: \(0+5y=5\), or \(y=1\), and \(2(0)-y=-4\) or \(y=4\). Using these x- and y- intercept values, the line that has equation \(x+5y=5\) passes through the points \((0, 1)\) and \((5, 0)\), and the line that has equation \(2x-y=-4\) passes through the points \((0, 4)\) and \((-2, 0)\). Only the lines in choice C pass through these points and can be used to solve the given system of equations.

Choices A, B, and D are incorrect. In choices A and B, neither line passes through \((0, 1)\) and \((5, 0)\) or \((0, 4)\) and \((-2, 0)\). In choice D, although one line passes through \((0, 4)\) and \((-2, 0)\) the other line doesn't pass through \((0, 1)\) and \((5, 0)\).`,
  },
  {
    id: 'ea8bd66f', skill: SY, type: 'mcq', answer: 'D',
    prompt: R`\[\begin{gathered} y=4x\\ 5x-3y=-14\end{gathered}\]
The solution to the given system of equations is \((x, y)\). What is the value of \(x+y\)?`,
    options: [R`\(4\)`, R`\(6\)`, R`\(8\)`, R`\(10\)`],
    explanation: R`Choice D is correct. The first equation in the given system is \(y=4x\). Substituting \(4x\) for \(y\) in the second equation yields \(5x-3(4x)=-14\), which is equivalent to \(5x-12x=-14\), or \(-7x=-14\). Dividing both sides of this equation by \(-7\) yields \(x=2\). Substituting \(2\) for \(x\) in the equation \(y=4x\) yields \(y=4(2)\), or \(y=8\). Substituting \(2\) for \(x\) and \(8\) for \(y\) in the expression \(x+y\) yields \(2+8\), or \(10\).

Choice A is incorrect and may result from conceptual or calculation errors.

Choice B is incorrect. This is the value of \(y-x\), not the value of \(x+y\).

Choice C is incorrect. This is the value of \(y\), not the value of \(x+y\).`,
  },
  {
    id: 'ed92fb68', skill: SY, type: 'mcq', answer: 'C',
    prompt: R`\[\begin{gathered} 4x+5y=100\\ 5x+4y=62\end{gathered}\]
If the system of equations above has solution \((x, y)\), what is the value of \(x+y\) ?`,
    options: ['0', '9', '18', '38'],
    explanation: `Choice C is correct. Adding the given equations yields 9x + 9y = 162. Dividing each side of the equation 9x + 9y = 162 by 9 gives x + y = 18.

Choice A is incorrect and may result from incorrectly adding the equations. Choice B is incorrect and may result from conceptual or computational errors. Choice D is incorrect. This value is equivalent to y – x.`,
  },
  {
    id: '19fdf387', skill: SY, type: 'mcq', answer: 'C',
    prompt: R`In the xy-plane, the graph of \(y=x+3\) intersects the graph of \(y=2x-6\) at the point \((a, b)\). What is the value of a ?`,
    options: ['3', '6', '9', '12'],
    explanation: R`Choice C is correct. Since the graph of \(y=x+3\) intersects the graph of \(y=2x-6\) at the point \((a, b)\), the ordered pair \((a, b)\) is the solution to the system of linear equations consisting of \(y=x+3\) and \(y=2x-6\), and the value of a is the value of x in the solution of this system. Since both \(x+3\) and \(2x-6\) are equal to y, it follows that \(x+3=2x-6\). Subtracting x from and adding 6 to both sides of the equation yields \(9=x\). Therefore, the value of a is 9.

Choices A and B are incorrect and may result from a calculation or conceptual error in solving the system of equations consisting of \(y=x+3\) and \(y=2x-6\). Choice D is incorrect. This is the value of b, not a.`,
  },
  {
    id: 'c5082ce3', skill: SY, type: 'spr', accepted: ['30'],
    prompt: 'The score on a trivia game is obtained by subtracting the number of incorrect answers from twice the number of correct answers. If a player answered 40 questions and obtained a score of 50, how many questions did the player answer correctly?',
    explanation: R`The correct answer is 30. Let x represent the number of correct answers from the player and y represent the number of incorrect answers from the player. Since the player answered 40 questions in total, the equation \(x+y=40\) represents this situation. Also, since the score is found by subtracting the number of incorrect answers from twice the number of correct answers and the player received a score of 50, the equation \(2x-y=50\) represents this situation. Adding the equations in the system of two equations together yields \((x+y)+(2x-y)=40+50\). This can be rewritten as \(3x=90\). Finally, solving for x by dividing both sides of the equation by 3 yields \(x=30\).`,
  },
  {
    id: '340afb12', skill: SY, type: 'mcq', answer: 'C',
    prompt: R`Ellen bought two types of snack bags for a school event. Each box of chips Ellen bought contained \(24\) bags and cost \(\$11\). Each box of crackers Ellen bought contained \(16\) bags and cost \(\$9\). It cost Ellen \(\$497\) before tax to buy \(968\) bags. If \(x\) is the number of boxes of chips and \(y\) is the number of boxes of crackers that Ellen bought, which of the following systems of equations represents this situation?`,
    options: [sys('11x+16y=968', '24x+9y=497'), sys('11x+9y=968', '24x+16y=497'), sys('11x+9y=497', '24x+16y=968'), sys('9x+11y=497', '16x+24y=968')],
    explanation: R`Choice C is correct. It's given that Ellen bought two types of snack bags: chips and crackers. It's also given that each box of chips contains \(24\) bags. Thus, if Ellen bought \(x\) boxes of chips, the number of bags of chips is \(24x\). Additionally, it's given that each box of chips costs \(\$11\). Thus, if Ellen bought \(x\) boxes of chips, the cost for all the bags of chips is \(11x\). It's also given that each box of crackers contains \(16\) bags. Thus, if Ellen bought \(y\) boxes of crackers, the number of bags of crackers is \(16y\). Additionally, it's given that each box of crackers costs \(\$9\). Thus, if Ellen bought \(y\) boxes of crackers, the cost for all the bags of crackers is \(9y\). It's given that it cost Ellen \(\$497\) to buy \(968\) bags. Since Ellen bought \(24x\) bags of chips and \(16y\) bags of crackers, the total number of snack bags that Ellen bought can be represented by the equation \(24x+16y=968\). Additionally, since the cost for all the bags of chips is \(11x\) and the cost for all the bags of crackers is \(9y\), the total cost for all the snack bags that Ellen bought can be represented by the equation \(11x+9y=497\). Therefore, the system consisting of the equations \(11x+9y=497\) and \(24x+16y=968\) represents this situation.

Choice A is incorrect and may result from conceptual or calculation errors.

Choice B is incorrect. This system of equations represents a situation where the total cost is \(\$968\), not \(\$497\), and the total number of bags is \(497\), not \(968\).

Choice D is incorrect and may result from conceptual or calculation errors.`,
  },
  {
    id: 'bd45df49', skill: SY, type: 'mcq', answer: 'D',
    prompt: R`\[\begin{gathered} y=3x+9\\ 3y=8x-6\end{gathered}\]
The solution to the given system of equations is \((x, y)\). What is the value of \(x-y\)?`,
    options: [R`\(-123\)`, R`\(-33\)`, R`\(3\)`, R`\(57\)`],
    explanation: R`Choice D is correct. The first equation in the given system of equations defines \(y\) as \(3x+9\). Substituting \(3x+9\) for \(y\) in the second equation in the given system of equations yields \(3(3x+9)=8x-6\). Applying the distributive property on the left-hand side of this equation yields \(9x+27=8x-6\). Subtracting \(8x\) from both sides of this equation yields \(x+27=-6\). Subtracting \(27\) from both sides of this equation yields \(x=-33\). Substituting \(-33\) for \(x\) in the first equation of the given system of equations yields \(y=3(-33)+9\), or \(y=-90\). Substituting \(-33\) for \(x\) and \(-90\) for \(y\) into the expression \(x-y\) yields \(-33-(-90)\), or \(57\).

Choice A is incorrect. This is the value of \(x+y\), not \(x-y\).

Choice B is incorrect. This is the value of \(x\), not \(x-y\).

Choice C is incorrect and may result from conceptual or calculation errors.`,
  },
  {
    id: '6e50ce28', skill: SY, type: 'mcq', answer: 'A',
    prompt: R`The sum of a number \(x\) and \(7\) is twice as large as a number \(y\). The number \(y\) is \(3\) less than the number \(x\). Which system of equations describes this situation?`,
    options: [sys('x+7=2y', 'y=x-3'), sys('x+7=2y', 'y=3-x'), sys('2(x+7)=y', 'y=x-3'), sys('2(x+7)=y', 'y=3-x')],
    explanation: R`Choice A is correct. It's given that the sum of a number \(x\) and \(7\) is twice as large as a number \(y\). This can be described by the equation \(x+7=2y\). It's also given that the number \(y\) is \(3\) less than the number \(x\). This can be described by the equation \(y=x-3\). Therefore, the system consisting of the equations \(x+7=2y\) and \(y=x-3\) describes this situation.

Choice B is incorrect. The equation \(y=3-x\) describes a situation where the number \(y\) is \(x\) less than \(3\).

Choice C is incorrect. The equation \(2(x+7)=y\) describes a situation where the number \(y\) is twice the sum of a number \(x\) and \(7\).

Choice D is incorrect. The equation \(2(x+7)=y\) describes a situation where the number \(y\) is twice the sum of a number \(x\) and \(7\), and the equation \(y=3-x\) describes a situation where a number \(y\) is \(x\) less than \(3\).`,
  },
  {
    id: '2875ba81', skill: SY, type: 'mcq', answer: 'A',
    prompt: R`\[\begin{gathered} 6x+7y=28\\ 2x+2y=10\end{gathered}\]
The solution to the given system of equations is \((x, y)\). What is the value of y?`,
    options: [R`\(-2\)`, R`\(7\)`, R`\(14\)`, R`\(18\)`],
    explanation: R`Choice A is correct. The given system of linear equations can be solved by the elimination method. Multiplying each side of the second equation in the given system by \(3\) yields \((2x+2y)(3)=(10)(3)\), or \(6x+6y=30\). Subtracting this equation from the first equation in the given system yields \((6x+7y)-(6x+6y)=(28)-(30)\), which is equivalent to \((6x-6x)+(7y-6y)=28-30\), or \(y=-2\).

Choice B is incorrect. This is the value of \(x\), not the value of \(y\).` + '\n\n' + ce('C', 'D'),
  },
  {
    id: 'e77a76ce', skill: SY, type: 'mcq', answer: 'A',
    prompt: 'Which of the following systems of linear equations has no solution?',
    options: [sys('y=6x+3', 'y=6x+9'), sys('y=10', 'y=10x+10'), sys('y=14x+14', 'y=10x+14'), sys('x=3', 'y=10')],
    explanation: R`Choice A is correct. A system of two linear equations in two variables, \(x\) and \(y\), has no solution if the graphs of the lines represented by the equations in the xy-plane are distinct and parallel. The graphs of two lines in the xy-plane represented by equations in slope-intercept form, \(y=mx+b\), where \(m\) and \(b\) are constants, are parallel if their slopes, \(m\), are the same and are distinct if their y-coordinates of the y-intercepts, \(b\), are different. In the equations \(y=6x+3\) and \(y=6x+9\), the values of \(m\) are each \(6\), and the values of \(b\) are \(3\) and \(9\), respectively. Since the slopes of these lines are the same and the y-coordinates of the y-intercepts are different, it follows that the system of linear equations in choice A has no solution.

Choice B is incorrect. The two lines represented by these equations are a horizontal line and a line with a slope of \(10\) that have the same y-coordinate of the y-intercept. Therefore, this system has a solution, \((0, 10)\), rather than no solution.

Choice C is incorrect. The two lines represented by these equations have different slopes and the same y-coordinate of the y-intercept. Therefore, this system has a solution, \((0, 14)\), rather than no solution.

Choice D is incorrect. The two lines represented by these equations are a vertical line and a horizontal line. Therefore, this system has a solution, \((3, 10)\), rather than no solution.`,
  },
  {
    id: '5e422ff9', skill: SY, type: 'mcq', answer: 'D',
    prompt: R`\[\begin{gathered} y=2x-3\\ 3y=5x\end{gathered}\]
In the solution to the system of equations above, what is the value of y ?`,
    options: [R`\(-15\)`, R`\(-9\)`, '9', '15'],
    explanation: R`Choice D is correct. Multiplying both sides of \(y=2x-3\) by 5 results in \(5y=10x-15\). Multiplying both sides of \(3y=5x\) by 2 results in \(6y=10x\). Subtracting the resulting equations yields \(5y-6y=(10x-15)-(10x)\), which simplifies to \(-y=-15\). Dividing both sides of \(-y=-15\) by \(-1\) results in \(y=15\).

Choices A and B are incorrect and may result from incorrectly subtracting the transformed equation. Choice C is incorrect and may result from finding the value of x instead of the value of y.`,
  },
  {
    id: '080e75c2', skill: SY, type: 'mcq', answer: 'C', image: IMG('080e75c2'),
    prompt: R`The functions \(f\) and \(g\) model the number of participants, in thousands, in two different programs \(x\) years since \(2010\). The graphs of \(y=f(x)\) and \(y=g(x)\) are shown. Which of the following could represent functions \(f\) and \(g\)?`,
    options: [
      sys('f(x)=-\\frac{4}{11}x+13', 'g(x)=\\frac{2}{11}x+7'),
      sys('f(x)=-\\frac{4}{11}x+7', 'g(x)=\\frac{2}{11}x+13'),
      sys('f(x)=-\\frac{2}{11}x+13', 'g(x)=\\frac{4}{11}x+7'),
      sys('f(x)=-\\frac{2}{11}x+7', 'g(x)=\\frac{4}{11}x+13'),
    ],
    explanation: R`Choice C is correct. A line in the xy-plane that passes through the points \((x_1, y_1)\) and \((x_2, y_2)\) has slope \(m\), where \(m=\frac{y_2-y_1}{x_2-x_1}\). The equation of the line can be written in the form \(y=mx+b\), where \(b\) is the y-intercept represented by \((0, b)\). One of the lines shown in the graph passes through the points \((0, 7)\) and \((11, 11)\). Substituting \(0\) for \(x_1\), \(7\) for \(y_1\), \(11\) for \(x_2\), and \(11\) for \(y_2\) in the equation \(m=\frac{y_2-y_1}{x_2-x_1}\) yields \(m=\frac{11-7}{11-0}\), or \(m=\frac{4}{11}\). Substituting \(\frac{4}{11}\) for \(m\) and \(7\) for \(b\) in the equation \(y=mx+b\) yields \(y=\frac{4}{11}x+7\). Therefore, an equation of this line is \(y=\frac{4}{11}x+7\). Similarly, the other line shown in the graph passes through the points \((0, 13)\) and \((11, 11)\). Substituting \(0\) for \(x_1\), \(13\) for \(y_1\), \(11\) for \(x_2\), and \(11\) for \(y_2\) in the equation \(m=\frac{y_2-y_1}{x_2-x_1}\) yields \(m=\frac{11-13}{11-0}\), or \(m=\frac{-2}{11}\). Substituting \(\frac{-2}{11}\) for \(m\) and \(13\) for \(b\) in the equation \(y=mx+b\) yields \(y=\frac{-2}{11}x+13\). Therefore, an equation of this line is \(y=\frac{-2}{11}x+13\). So, the functions \(f\) and \(g\) could be represented by \(f(x)=\frac{-2}{11}x+13\) and \(g(x)=\frac{4}{11}x+7\).` + '\n\n' + ce('A', 'B', 'D'),
  },
  {
    id: '2704399f', skill: SY, type: 'mcq', answer: 'A', image: IMG('2704399f'),
    prompt: 'Which of the following systems of equations has the same solution as the system of equations graphed above?',
    options: [sys('y=0', 'x=\\frac{3}{2}'), sys('y=\\frac{3}{2}', 'x=0'), sys('y=0', 'x=1'), sys('y=1', 'x=0')],
    explanation: R`Choice A is correct. The solution to a system of equations is the coordinates of the intersection point of the graphs of the equations in the xy-plane. Based on the graph, the solution to the given system of equations is best approximated as \(\left(\frac{3}{2}, 0\right)\). In the xy-plane, the graph of \(y=0\) is a horizontal line on which every y-coordinate is 0, and the graph of \(x=\frac{3}{2}\) is a vertical line on which every x-coordinate is \(\frac{3}{2}\). These graphs intersect at the point \(\left(\frac{3}{2}, 0\right)\). Therefore, the system of equations in choice A has the same solution as the given system.

Choices B, C, and D are incorrect. If graphed in the xy-plane, these choices would intersect at the points \(\left(0, \frac{3}{2}\right)\), \((1, 0)\), and \((0, 1)\), respectively, not \(\left(\frac{3}{2}, 0\right)\).`,
  },
  {
    id: 'b544a348', skill: SY, type: 'spr', accepted: ['7'],
    prompt: R`\[\begin{gathered} 5x+3y=38\\ x+3y=10\end{gathered}\]
In the solution \((x, y)\) to the system of equations above, what is the value of x ?`,
    explanation: R`The correct answer is 7. Subtracting the second equation from the first equation eliminates the variable y.
\[\begin{array}{rcl} 5x+3y & = & 38\\ -(x+3y & = & 10)\\ 4x & = & 28\end{array}\]
Dividing both sides of the resulting equation by 4 yields x = 7.`,
  },
  {
    id: '65833256', skill: SY, type: 'mcq', answer: 'A',
    prompt: R`\[\begin{gathered} y=6x+16\\ -7x-y=36\end{gathered}\]
What is the solution \((x, y)\) to the given system of equations?`,
    options: [R`\((-4, -8)\)`, R`\(\left(-\frac{20}{13}, -\frac{80}{13}\right)\)`, R`\((4, 40)\)`, R`\((20, 136)\)`],
    explanation: R`Choice A is correct. The given system of linear equations can be solved by the substitution method. The first equation in the given system of equations defines \(y\) as \(6x+16\). Substituting \(6x+16\) for \(y\) in the second equation of the given system of equations yields \(-7x-(6x+16)=36\). Applying the distributive property on the left-hand side of this equation yields \(-7x-6x-16=36\), or \(-13x-16=36\). Adding \(16\) to both sides of this equation yields \(-13x=52\). Dividing both sides of this equation by \(-13\) yields \(x=-4\). Substituting \(-4\) for \(x\) in the first equation of the given system of equations, \(y=6x+16\), yields \(y=6(-4)+16\), or \(y=-8\). Therefore, the solution \((x, y)\) to the given system of equations is \((-4, -8)\).` + '\n\n' + ce('B', 'C', 'D'),
  },
];
