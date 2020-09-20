// TODO: MAKE FASTER BY CALCULATING REGULARZATION AT VERY END

const ACTIVATIONS = {
    SIGMOID: {
        VALUE: (z) => 1 / (1 + Math.exp(-z)),
        DERIVATIVE: (z) => {
            let output = 1 / (1 + Math.exp(-z));
            return output * (1 - output);
        }
    }
}

const ERROR = {
    CROSSENTROPY: {
        VALUE: (a, y) => {
            if (y === 0) {
                return -Math.log(1 - a);
            } else if (y === 1) {
                return -Math.log(a);
            }

            throw "PARAMETER Y NOT 1 OR 0";
        },

        DERIVATIVE: (a, y) => {
            if (y === 0) {
                return 1 / (1 - a);
            } else if (y === 0) {
                return -1 / a;
            }

            throw "PARAMETER Y NOT 1 OR 0";
        },

        SIGMOID: {
            VALUE: (z, y) => {
                if (y === 0) {
                    return Math.log(1 + Math.exp(-z));
                } else if (y === 1) {
                    return z + Math.log(1 + Math.exp(-z));
                }
            },

            DERIVATIVE: (z, y) => {
                return y - (1 / (1 + Math.exp(-z)));
            }
        }
    }
}

/**
 * @class NN
 * @classdesc Creates an artificial neural network
 */
class NN {

    /**
     * @constructor
     * @param {Object} options
     * @param {number[]} options.labels
     * @param {number[]} options.training
     * @param {Object[]} options.csv
     * @param {number} [options.rate]
     * @param {Object} [options.json]
     */
    constructor(options) {

        this.alpha = options.rate || 0.5;
        this.gradientChecking = false;

        /**
         * @type {Object}
         * @property {Element} div
         */
        this.ui = {
            active: false,
            active: true,
            div: undefined,
            trainOnceButton: undefined,
            trainbutton: undefined,
            nextandlogbutton: undefined,
            nextbutton: undefined,
            downloadButton: undefined,
            updateButton: undefined,
            iterations: undefined,
        };

        this.labels = options.labels;
        this.csv = options.csv;

        this.trainingData = options.training;
        this.numTraining = this.trainingData.length;

        this.weightInit = 1;

        this.lambda = 0.001;

        this.batchSize = 200;
        this.totalBatches = Math.floor(this.numTraining / this.batchSize);
        this.currBatch = Math.floor(Math.random() * this.totalBatches);

        this.numCSV = 200;
        this.numTrainingCostNum = 300;

        this.batches = [];

        this.shuffleData();

        this.layers = [options.inputs, 5, options.outputs];
        if (options.layers) {
            this.layers = options.layers;
        } else if (options.json) {
            this.layers = options.json.layers;
        }


        this.activation = options.activation || function (x) {
            let returnval = 1 / (1 + Math.exp(-x));
            return returnval;
        };
        this.activationDerivative = options.activationDerivative || function (x) {
            let returnval = Math.exp(-Math.abs(x)) / Math.pow(1 + Math.exp(-Math.abs(x)), 2)
            return returnval;
        }

        this.m = 0;
        for (let i = 0; i < this.layers.length; i++) {
            this.m += this.layers[i];
        }

        this.lambda /= this.m;

        this.cost = options.costfunc || function (x, y) {
            let returnval = (y === 0) ? ((x < 10) ? Math.log(1 + Math.exp(-x)) + x : x) :
                ((x > -10) ? Math.log(1 + Math.exp(-x)) : -x);
            returnval /= this.batchSize;
            return returnval;
        }
        this.costDerivative = options.costDerivative || function (x, y) {
            let returnval = 1 / (1 + Math.exp(-x)) - y;
            returnval /= this.batchSize;
            return returnval;
        }

        this.regularization = options.regularization || function (x) {
            return this.lambda / 2 * x * x / this.m;
        }

        this.regularizationDerivative = options.regularizationDerivative || function (x) {
            return this.lambda * x / this.m;
        }


        this.gradientCheckingWeightDerivatives = [
            []
        ];
        this.weightDerivatives = [
            []
        ];
        this.weights = [
            []
        ];
        for (let i = 1; i < this.layers.length; i++) {

            this.weightDerivatives[i] = [];
            this.weights[i] = []
            this.gradientCheckingWeightDerivatives[i] = []

            for (let j = 0; j < this.layers[i]; j++) {

                this.weights[i].push([]);
                this.gradientCheckingWeightDerivatives[i].push([])
                this.weightDerivatives[i].push([])

                for (let k = 0; k < this.layers[i - 1] + 1; k++) {

                    this.weights[i][j].push(Math.random() * this.weightInit - this.weightInit / 2);
                    this.gradientCheckingWeightDerivatives[i][j].push(-1);
                    this.weightDerivatives[i][j].push(-1);

                }
            }
        }

        this.beforeActivationVals = [];
        this.vals = [];
        this.nodeDerivatives = [];
        for (let i = 0; i < this.layers.length; i++) {
            this.vals.push([]);
            this.beforeActivationVals.push([]);
            this.nodeDerivatives.push([]);
            for (let j = 0; j < this.layers[i]; j++) {
                this.vals[i].push(-1);
                this.beforeActivationVals[i].push(-1);
                this.nodeDerivatives[i].push(-1);
            }
        }

        this.costs = [];
        this.currentCost = 0;

        this.gradientCheckingEpsilon = 0.001;

        this.normalizeData();

        if (options.json) {
            this.weights = options.json.weights;
        }

    }

    /**
     * @returns {undefined}
     * @description Shuffles the training data
     */
    shuffleData() {
        for (let i = this.trainingData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * i);
            const temp = this.trainingData[i]
            this.trainingData[i] = this.trainingData[j]
            this.trainingData[j] = temp
        }
    }

    /**
     * @returns {undefined}
     * @description Normalizes the training set, sets standard deviations and averages of features.
     */
    normalizeData() {
        this.avg = [];
        this.standardDeviations = [];
        for (let i = 0; i < this.layers[0]; i++) {
            this.avg[i] = 0;
            this.standardDeviations[i] = 0;
        }

        for (const example of this.trainingData) {
            for (let i = 0; i < this.layers[0]; i++) {
                this.avg[i] += example.input[i];
            }
        }

        for (let i = 0; i < this.layers[0]; i++) {
            this.avg[i] /= this.trainingData.length;
        }

        for (const example of this.trainingData) {
            for (let i = 0; i < this.layers[0]; i++) {
                this.standardDeviations[i] += (example.input[i] - this.avg[i]) * (example.input[i] - this.avg[i]);
            }
        }

        for (let i = 0; i < this.layers[0]; i++) {
            this.standardDeviations[i] /= this.trainingData.length;
            this.standardDeviations[i] = Math.sqrt(this.standardDeviations[i])
        }

        for (let example of this.trainingData) {
            for (let i = 0; i < this.layers[0]; i++) {
                example.input[i] -= this.avg[i];
                if (this.standardDeviations[i] != 0) {
                    example.input[i] /= this.standardDeviations[i];
                }
            }
        }

    }

    /**
     * @param {Element} dom
     * @description Sets a download of the weights of the Neural Network up in the given dom element.
     */
    getBlob(dom) {
        let blub = new Blob([JSON.stringify({
            layers: this.layers,
            weights: this.weights
        })], {
            type: "application/json"
        });
        dom.download = "NN.json"
        dom.href = window.URL.createObjectURL(blub);
    }

    /**
     * @param {number[]} origInputs 
     * @returns {number[]}
     * @description Runs and logs the result in the UI console.
     */
    runAndLog(origInputs) {
        inputs = this.normalize(origInputs);
        let results = this.forwardPropogate(inputs);

        if (this.ui.active) {
            this.ui.console.log(`Ran Inputs:`, origInputs, ` ( => Normalized:`, inputs, `)`)
            this.ui.console.log(`Output: `, results)
        }

        return results;
    }

    /**
     * @param {number[]} inputsOrig 
     * @returns {number[]}
     * @description Maps a parameter using the already calculated standard deviations and averages.
     */
    normalize(inputsOrig) {
        let inputs = [];
        for (let i = 0; i < inputsOrig.length; i++) {
            inputs.push(inputsOrig[i]);
            inputs[i] -= this.avg[i];
            if (this.standardDeviations[i] != 0) {
                inputs[i] /= this.standardDeviations[i];
            }
        }
        return inputs;
    }

    /**
     * @param {number[]} inputsOrig 
     * @returns {number[]}
     * @description Forward propogates the neural network, includes normalization.
     */
    run(inputsOrig) {
        let inputs = this.normalize(inputsOrig);
        return this.forwardPropogate(inputs);
    }

    runRealOutput(inputsOrig) {
        let inputs = this.normalize(inputsOrig);
        let stuff =  this.forwardPropogate(inputs);
        let maxval = -1;
        let maxind = 0;
        for (let i = 0; i < stuff.length; i++) {
            if (stuff[i] > maxval) {
                maxval = stuff[i];
                maxind = i;
            }
        }
        return maxind
    }

    /**
     * @param {number[]} inputs 
     * @returns {{ outputs: number[], beforeOutputs: number[]}}
     * @description Forward propogates and returns the outputs before and after activation.
     */
    forwardPropogateInfo(inputs) {
        this.vals[0] = inputs;
        this.beforeActivationVals[0] = inputs;
        for (let i = 1; i < this.layers.length; i++) {

            for (let j = 0; j < this.layers[i]; j++) {
                let sum = this.weights[i][j][0];

                for (let k = 0; k < this.layers[i - 1]; k++) {
                    sum += this.vals[i - 1][k] * this.weights[i][j][k + 1];
                }

                this.beforeActivationVals[i][j] = sum;
                this.vals[i][j] = this.activation(sum);

            }

        }

        return {
            outputs: this.vals[this.layers.length - 1],
            beforeOutputs: this.beforeActivationVals[this.layers.length - 1]
        };
    }

    /**
     * @param {number[]} inputs 
     * @returns {number[]}
     * @description Returns the outputs of forward propogation.
     */
    forwardPropogate(inputs) {
        return this.forwardPropogateInfo(inputs).outputs;
    }

    /**
     * @param {number[]} inputs 
     * @returns {number[]}
     * @description Returns the outputs of forward propogation, but before activation.
     */
    forwardPropogateBeforeVals(inputs) {
        return this.forwardPropogateInfo(inputs).beforeOutputs;
    }

    /**
     * @param {number[]} beforeoutputs 
     * @param {number} label 
     * @returns {number}
     * @description Calculate the cost for a training example.
     */
    getCost(beforeoutputs, label) {
        let accumulatedCost = 0;

        for (let i = 0; i < this.weights.length; i++) {
            for (let j = 0; j < this.weights[i].length; j++) {
                for (let k = 1; k < this.weights[i][j].length; k++) {
                    accumulatedCost += this.regularization(this.weights[i][j][k]);
                }
            }
        }

        for (let i = 0; i < beforeoutputs.length; i++) {
            accumulatedCost += this.cost(beforeoutputs[i], Number(i === label));
        }

        return accumulatedCost;
    }

    /**
     * 
     * @param {number[]} beforeoutputs 
     * @param {number} label 
     * @returns {number}
     * @description Calculates the cost, then appends it to the cost array.
     */
    getAndAddCost(beforeoutputs, label) {
        let accumulatedCost = this.getCost(beforeoutputs, label);
        this.currentCost += (accumulatedCost);
        return accumulatedCost;
    }

    /**
     * @param {number[]} inputs 
     * @param {number} label
     * @description Backpropogates once. 
     */
    backPropogateOnce(inputs, label) {
        let outputs = this.forwardPropogateBeforeVals(inputs);
        let currcost = this.getAndAddCost(outputs, label)

        for (let i = 0; i < this.layers[this.layers.length - 1]; i++) {
            this.nodeDerivatives[this.layers.length - 1][i] =
                this.costDerivative(this.beforeActivationVals[this.layers.length - 1][i], Number(i === label));
        }

        for (let i = this.layers.length - 2; i >= 1; i--) {
            for (let j = 0; j < this.layers[i]; j++) {

                let accumulatedDerivative = 0;
                for (let k = 0; k < this.layers[i + 1]; k++) {
                    accumulatedDerivative += this.activationDerivative(this.beforeActivationVals[i][j]) *
                        this.weights[i + 1][k][j + 1] *
                        this.nodeDerivatives[i + 1][k];
                }

                this.nodeDerivatives[i][j] = accumulatedDerivative;

            }
        }
        for (let i = this.layers.length - 1; i >= 1; i--) {
            for (let j = 0; j < this.layers[i]; j++) {
                for (let k = 0; k < this.layers[i - 1] + 1; k++) {
                    if (k === 0) {
                        this.weightDerivatives[i][j][k] += this.nodeDerivatives[i][j];
                        if (this.gradientChecking) {
                            // if(false){
                            this.weights[i][j][k] += this.gradientCheckingEpsilon;
                            let newcost = this.getCost(this.forwardPropogateBeforeVals(inputs), label);
                            this.weights[i][j][k] -= this.gradientCheckingEpsilon;
                            this.gradientCheckingWeightDerivatives[i][j][k] += (newcost - currcost) / this.gradientCheckingEpsilon;
                        }
                    } else {
                        this.weightDerivatives[i][j][k] += this.nodeDerivatives[i][j] *
                            this.vals[i - 1][k - 1];
                        this.weightDerivatives[i][j][k] += this.regularizationDerivative(this.weights[i][j][k]);

                        // this took too long to process

                        // if (this.gradientChecking){
                        // if(false){
                        //     this.weights[i][j][k] += this.gradientCheckingEpsilon;
                        //     let newcost = this.getCost(this.forwardPropogateBeforeVals(inputs), label);
                        //     this.weights[i][j][k] -= this.gradientCheckingEpsilon;

                        //     this.gradientCheckingWeightDerivatives[i][j][k] += (newcost - currcost) / this.gradientCheckingEpsilon;
                        // }
                    }

                }
            }
        }
    }

    /**
     * @returns {number[][]}
     * @description Returns the confusion matrix for the first few CSV examples
     */
    costCSV() {
        let confusionMatrix = [];
        for (let i = 0; i < this.labels.length; i++) {
            confusionMatrix[i] = [];
            for (let j = 0; j < this.labels.length; j++) {
                confusionMatrix[i][j] = 0;
            }
        }

        for (let i = 0; i < this.numCSV; i++) {
            const {
                input,
                label
            } = this.csv[i];
            let output = this.run(input); // @TODO: When you run the values, you divide the reference
            // console.log(output);

            let maxOutput = -1;
            let maxIndex = -1;
            for (let i = 0; i < output.length; i++) {
                const element = output[i];
                if (element > maxOutput) {
                    maxOutput = element;
                    maxIndex = i;
                }
            }

            confusionMatrix[label][maxIndex]++;
        }
        return confusionMatrix;
    }

    /**
     * @returns {number[][]}
     * @description Returns the confusion matrix for the first few training examples
     */
    costTrain() {
        let confusionMatrix = [];
        for (let i = 0; i < this.labels.length; i++) {
            confusionMatrix[i] = [];
            for (let j = 0; j < this.labels.length; j++) {
                confusionMatrix[i][j] = 0;
            }
        }

        for (let i = 0; i < this.numCSV; i++) {
            const {
                input,
                label
            } = this.trainingData[i];
            let output = this.forwardPropogate(input); // @TODO: When you run the values, you divide the reference
            // console.log(output);

            let maxOutput = -1;
            let maxIndex = -1;
            for (let i = 0; i < output.length; i++) {
                const element = output[i];
                if (element > maxOutput) {
                    maxOutput = element;
                    maxIndex = i;
                }
            }

            confusionMatrix[label][maxIndex]++;
        }
        return confusionMatrix;
    }

    /**
     * @param {number[][]} iamconfusion 
     * @returns {{ precision: number[], recall: number[], fscores: number[], macroAvg: number, correct: number }}
     * @description Analyzes the confusion matrix
     */
    analyzeConfusionMatrix(iamconfusion) {
        let returnobj = {
            recall: [],
            precision: [],
            correct: -1,
            fscores: [],
            macroAvg: 0,
        }

        let dim = iamconfusion.length;

        let totalNum = 0;
        let actualTotalCorrect = 0;

        for (let i = 0; i < dim; i++) {
            let totalcorrek = iamconfusion[i][i];
            actualTotalCorrect += iamconfusion[i][i];
            let totallabel = 0;
            let totalclassified = 0;
            for (let j = 0; j < dim; j++) {
                totallabel += iamconfusion[i][j];
                totalNum += iamconfusion[i][j];
                totalclassified += iamconfusion[j][i];
            }

            returnobj.recall.push(totalcorrek / totallabel);

            if (totalclassified === 0) {
                returnobj.precision.push(0);
            } else {
                returnobj.precision.push(totalcorrek / totalclassified);
            }

            if (returnobj.recall[i] + returnobj.precision[i] === 0) {
                returnobj.fscores.push(0)
            } else {
                returnobj.fscores.push(2 * (returnobj.recall[i] * returnobj.precision[i]) /
                    (returnobj.recall[i] + returnobj.precision[i]));
            }

            returnobj.macroAvg += returnobj.fscores[i];

        }

        returnobj.correct = (actualTotalCorrect / totalNum);
        returnobj.macroAvg /= dim;

        return returnobj;

    }

    /**
     * @description Updates the grids in the UI
     */
    updateGrid() {
        if (this.ui) {
            let curr = this.costCSV()
            let analysis = this.analyzeConfusionMatrix(curr)
            this.ui.grid.changeArray({
                array: curr,
                analysis: analysis
            })
            this.csvfscores.push(analysis.macroAvg)
            this.csvprecisions.push(analysis.correct)

            curr = this.costTrain()
            analysis = this.analyzeConfusionMatrix(curr)
            this.ui.traingrid.changeArray({
                array: curr,
                analysis: analysis
            })
            this.trainfscores.push(analysis.macroAvg)
            this.trainprecisions.push(analysis.correct)
        }
    }

    /**
     * @param {number} step 
     * @description Changes the step size
     */
    changeStep(step) {
        this.alpha = step;
    }

    /**
     * @param {number} size 
     * @description Changes the batch size
     */
    changeBatch(size) {
        this.batchSize = size;
        this.totalBatches = Math.floor(this.numTraining / this.batchSize);
        this.currBatch = Math.floor(Math.random() * this.totalBatches);
    }

    /**
     * @description Batch trains once, and logs the result
     */
    batchTrainOnceAndLog() {
        this.prepareTrain();

        for (let index = this.currBatch * this.batchSize; index < (this.currBatch + 1) * this.batchSize; index++) {
            const example = this.trainingData[index];

            let {
                input,
                label
            } = example;
            this.backPropogateOnce(input, label);
        }

        this.currBatch++;
        if (this.currBatch >= this.totalBatches) {
            this.currBatch = 0;
            this.shuffleData();
        }

        this.compileCurrentIteration();

        if (this.ui.active) {
            // this.ui.graph.resizeBounds([-1, this.costs.length + 1, 0, this.costs[1]])
            this.ui.console.log(`Trained Once. Cost: `, this.costs[this.costs.length - 1])
        }
    }

    /**
     * @description Prepares to train by resetting weight derivatives.
     */
    prepareTrain() {
        this.currentCost = 0;
        for (let i = 1; i < this.weightDerivatives.length; i++) {
            for (let j = 0; j < this.weightDerivatives[i].length; j++) {
                for (let k = 0; k < this.weightDerivatives[i][j].length; k++) {
                    this.gradientCheckingWeightDerivatives[i][j][k] = 0;
                    this.weightDerivatives[i][j][k] = 0;
                }
            }
        }

    }

    /**
     * @description Compiles the current iteration, editing the weights.
     */
    compileCurrentIteration() {
        for (let i = 1; i < this.layers.length; i++) {
            for (let j = 0; j < this.layers[i]; j++) {
                for (let k = 0; k < this.layers[i - 1] + 1; k++) {
                    this.weights[i][j][k] -= this.alpha * this.weightDerivatives[i][j][k];
                }
            }
        }

        this.costs.push(this.currentCost);

        // this.prepareTrain();
        // console.log(this.weightDerivatives);
        // console.log(this.gradientCheckingWeightDerivatives);
    }

    /**
     * @description Batch trains once
     */
    batchTrainOnce() {
        this.prepareTrain();

        for (let index = this.currBatch * this.batchSize; index < (this.currBatch + 1) * this.batchSize; index++) {
            const example = this.trainingData[index];

            let {
                input,
                label
            } = example;
            this.backPropogateOnce(input, label);
        }
        this.currBatch++;
        if (this.currBatch >= this.totalBatches) {
            this.currBatch = 0;
            this.shuffleData();
        }

        this.compileCurrentIteration();

    }

    /**
     * @param {{iterations: number}} options 
     * @returns {Promise}
     * @description Batch trains multiple times.
     */
    batchTrain(options) {
        let trainPromise = new Promise((resolve, reject) => {

            for (let i = 0; i < options.iterations; i++) {
                this.batchTrainOnce();
                // console.log(i);
            }

            if (this.ui.active) {
                // this.ui.graph.resizeBounds([-1, this.costs.length + 1, 0, this.costs[0]])
                this.ui.console.log(`Trained `, options.iterations, ` times.`)
                this.ui.console.log(`Cost: `, this.costs[this.costs.length - 1])
            }

            this.updateGrid();

            resolve();
        })

        return trainPromise;
    }

}

let testSet = "bio's so hard wow"
let origtest = testSet;

let outputs = 
[
    "There is no such thing as a homework emergency", 
    "like all beautiful things, this quiz must come to an end", 
    "I'm going to say it three times. Rock Pocket Mice Activity is not homework. Rock Pocket Mice Activity is not homework. Rock Pocket Mice Activity is not homework.",
    "i'm lurking in the background",
    "I'm Mr.Little, your biology teacher!",
    "heh heh",
    "how did you guys like that?",
    "thats why biology is such a challenging course",
    "cannot not",
    "knock that out"
]

let trainingmat = [
    ["I have so much hw", "Wait, there's so much homework", "I'm never going to finish this homework", "There's just too much hw", "How much hw is there?"],
    ["When is this test over?", "Is the test over?", "When am I going to finish this quiz?", "The quiz better be over", "Did the test end?"],
    ["Is the rock pocket mice homework?", "Is the rpm activity homework?", "Is the rpm going to be hw?"],
    ["where are you?", "what are you doing?", "what do you do while we work?"],
    ["who are you?", "wait, who are you?"],
    ["LOL HAHA", "LMAO", "why did you assign all that hw?", "you gave us so much hw! why?", "why did you give us so much hw?"],
    ["WHAT WAS THAT?", "wait, was that you?"],
    ["There's so much bio hw", "bio h is so hard", "I hate biology honors", "bio honors has so much hw"],
    ["yesn't", "yes but no", "do you think so?", "yesnt"],
    [""]

]

let training = []
let labels = []

for(let i = 0; i < trainingmat.length; i++){
    for(let j = 0; j < trainingmat[i].length; j++){
        training.push(trainingmat[i][j]);
        labels.push(i);
    }
}


let allwords = [];
for(let train of training) {

    train = train.replace(/,\?/g, '')
    train = train.toLowerCase();

    const words = train.split(" ");
    for(let word of words) {
        if(!allwords.includes(word)){
            allwords.push(word)
        }
    }
}
// console.log(allwords)

for(let i = 0; i < training.length; i++) {
    let train = training[i];
    let freq = []
    for(const word of allwords) {
        if(train.includes(word)) {
            freq.push(1);
        } else {
            freq.push(0);
        }
    }
    training[i] = {
        input: freq,
        label: labels[i]
    }
}

testSet = testSet.replace(/.\?/g, "")
testSet = testSet.toLowerCase()
let testfreq = []
for (const word of allwords) {
    if (testSet.includes(word)) {
        testfreq.push(1);
    } else {
        testfreq.push(0);
    }
}

testSet = testfreq;

let nn = new NN({
    training: training,
    labels: labels,
    csv: [],
    rate: 0.1,
    layers: [allwords.length, 10, outputs.length]
})

nn.batchSize = 5;

let start = async function() {
    for (let i = 0; i < 1000; i++) {
        nn.batchTrainOnce()
        
    }

    console.log(origtest)
    console.log( outputs[ nn.runRealOutput(testSet) ])
}

start();
