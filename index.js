const Discord = require("discord.js");

require("dotenv").config();

const config = process.env.BOT_TOKEN

var admin = require('firebase-admin');
// console.log(serviceAccount.private_key)
serviceAccount = process.env;
// console.log(serviceAccount.private_key)

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://games-ff9af.firebaseio.com'
});

var db = admin.database();

const client = new Discord.Client();

const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { request } = require("http");

let moment = require("moment-timezone");
const { max } = require("moment-timezone");
// const { title } = require("process");

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

        // if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials({
        access_token: process.env.access_token,
        refresh_token: process.env.refresh_token,
        scope: process.env.scope,
        token_type: process.env.token_type,
        expiry_date: parseInt( process.env.expiry_date )
    });
    callback(oAuth2Client);
    // });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions

            console.log("NEW TOKEN!!: ")
            console.log(JSON.stringify(token))
            
            callback(oAuth2Client);
        });
    });
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const UPPERALPHABET = ALPHABET.toUpperCase();
const ALPHABETEMOJIS = "🇦 🇧 🇨 🇩 🇪 🇫 🇬 🇭 🇮 🇯 🇰 🇱 🇲 🇳 🇴 🇵 🇶 🇷 🇸 🇹 🇺 🇻 🇼 🇽 🇾 🇿".split(" ")

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

// let testSet = "I've just got so much hw but is the rpm rock mice thing hw?"

let outputs = ["There is no such thing as a homework emergency", "like all beautiful things, this quiz must come to an end", "I'm going to say it three times. Rock Pocket Mice Activity is not homework. Rock Pocket Mice Activity is not homework. Rock Pocket Mice Activity is not homework."]

let training0 = ["I have so much hw", "There's so much homework", "I'm never going to finish this homework", "There's just too much hw", "How much hw is there?"];
let labels0 = [0, 0, 0, 0, 0]

let training1 = ["When is this test over?", "Is the test over?", "When am I going to finish this quiz?", "The quiz better be over", "Did the test end?"]
let labels1 = [1, 1, 1, 1, 1]

let training2 = ["Is the rock pocket mice homework?", "Is the rpm activity homework?", "Is the rpm going to be hw?"]
let labels2 = [2, 2, 2, 2, 2, 2, 2, 2, ]

let training = [...training0, ...training1, ...training2]
let labels = [...labels0, ...labels1, ...labels2]
let allwords = [];
for (let train of training) {

    train = train.replace(/\?/g, '')
    train = train.toLowerCase();

    const words = train.split(" ");
    for (let word of words) {
        if (!allwords.includes(word)) {
            allwords.push(word)
        }
    }
}
// console.log(allwords)

for (let i = 0; i < training.length; i++) {
    let train = training[i];
    let freq = []
    for (const word of allwords) {
        if (train.includes(word)) {
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

// console.log(training);


let nn = new NN({
    training: training,
    labels: labels,
    csv: [],
    rate: 0.1,
    layers: [allwords.length, 10, 3]
})

nn.batchSize = 5;

/**
 * A TTT game class
 * @class
*/
class TTT {

    /**
     * @constructor
     * @param {Object} dbref - Database Reference to the Tic Tac Toe board
     */
    constructor(dbref) {
        
        this.ref = dbref;

        this.board = [[]];
        this.status = 0;
        this.get();

        this.turn = 1;

        this.XEMOJI = "<:obamaprism:748993582043627622>";
        this.OEMOJI = "<:obamasphere:750493919661260800>";
        this.NONEEMOJI = "⬛";
        this.NL = "\n"
        this.DIVIDER = "|"
        this.BLANK = "\\_"

        this.X = "Obama Prism";
        this.O = "Obama Sphere";

    }

    /**
     * @async 
     * @returns {number[][]} - Retrieves 
     */
    async get() {
        this.board = (await this.ref.once("value")).val();
        return this.board;
    }

    /**
     * 
     */
    set() {
        this.ref.set(this.board);
    }

    /**
     * Checks the status of the board
     * @returns {number} - 0 for neutral, 1 if 1 won, 2 if 2 won, 3 if cat's tie
     */
    check() {
        
        this.status = 0;
        
        /* Checks rows */
        for(let i = 0; i < this.board.length; i++){
            if(this.board[i][0] === this.board[i][1] && this.board[i][0] === this.board[i][2] && this.board[i][0] !== 0){
                this.status = this.board[i][0];
            }
        }

        /* Checks columns */
        for (let i = 0; i < this.board.length; i++) {
            if (this.board[0][i] === this.board[1][i] && this.board[0][i] === this.board[2][i] && this.board[0][i] !== 0) {
                this.status = this.board[0][i];
            }
        }

        /* Diagonals */
        if (this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2] && this.board[0][0] !== 0) this.status = this.board[0][0];
        if (this.board[2][0] === this.board[1][1] && this.board[1][1] === this.board[0][2] && this.board[2][0] !== 0) this.status = this.board[2][0];

        if(this.status === 0){
            let allFilled = true;
            for (let i = 0; i < this.board.length; i++) {
                for (let j = 0; j < this.board.length; j++) {
                    if (this.board[i][j] === 0) { allFilled = false; break; }
                }
            }
            if(allFilled){
                this.status = 3;
            }
        }

        return this.status;

    }

    /**
     * @async
     */
    async clear() {
        this.board = [[0,0,0],[0,0,0],[0,0,0]];
        this.turn = 1;
        this.check();
        this.set();
    }

    /**
     * Returns a message for the status
     * @returns {string} - a string for the status
     */
    statusText() {
        this.check();
        if(this.status === 0){
            return "Game is still in session.";
        } else if(this.status === 1) {
            return "Player 1 has won."
        } else if(this.status === 2) {
            return ("Player 2 has won.");
        } else {
            return "It was a tie.";
        }
    }

    /**
     * Returns whether its ended
     * @returns {boolean} - whether's its over
     */
    ended() {
        this.check();
        return this.status !== 0;
    }

    /**
     * @returns {Object} - returns representations
     */
    representations() {
        let text = "";
        let moves = "";

        let available = [];

        let emojitext = "";
        let emojimoves = "";

        for (let i = 0; i < this.board.length; i++) {
            for (let j = 0; j < this.board[i].length; j++) {

                if (this.board[i][j] === 0) {

                    text += this.BLANK;
                    moves += UPPERALPHABET[3 * i + j];
                    available.push(3 * i + j);
                    emojitext += this.NONEEMOJI;
                    emojimoves += ALPHABETEMOJIS[3*i + j];

                } else if (this.board[i][j] === 1) {
                    text += this.X;
                    moves += this.X;
                    emojitext += this.XEMOJI;
                    emojimoves += this.XEMOJI;
                } else {
                    text += this.O;
                    moves += this.O;
                    emojitext += this.OEMOJI;
                    emojimoves += this.OEMOJI;
                }

                emojimoves += " ";
                emojitext += " ";
                text += this.DIVIDER;
                moves += this.DIVIDER;

            }
            text += this.NL;
            moves += this.NL;
            emojitext += this.NL;
            emojimoves += this.NL;
        }

        const emojis = [];

        for (const num of available) {

            emojis.push(ALPHABETEMOJIS[num]);

        }

        return { text, moves, available, emojis, emojitext, emojimoves };

    }

    /**
     * @returns {string} - returns "Player 1" or "Player 2"
     */
    getPlayer() {
        return "Player " + this.turn + ", playing " + (this.turn === 1 ? this.X : this.O) ;
    }

    /**
     * @param {number} placement - placement
     */
    move(placement) {
        let i = Math.floor(placement/3);
        let j = placement % 3;
        this.board[i][j] = this.turn;
        this.turn = 3 - this.turn;
        this.set();
    }
    
    /**
     * Passes the turn
     */
    pass(){
        this.turn = 3 - this.turn;
    }

    /**
     * @param {string} emojistr - string of emoji
     */
    moveWithEmoji(emojistr) {
        const placement = ALPHABETEMOJIS.indexOf(emojistr);
        this.move(placement);
    }

}

/**
 * A text bot that parses commands for a TTT game
 * @class
 */
class TTTbot { 
    /**
     * @constructor
     * @param {Object} dbref - Database reference
     */
    constructor(dbref) {
        this.ttt = new TTT(dbref);

        this.running = true;

        this.players = ["","",""];

        this.DOGGO1 = "https://lh3.googleusercontent.com/pw/ACtC-3dcVBptJlQ3_jIEjuQOUYytgaWf86H7ki93UR4nCOrPDPImMG9PPbm5peZLsi-ibviO5Qb3k4SCCVPoxc61xgTOo4ha6d5Zy7usNJFYjIyqi_N608rMxuEt63xL3xqfPOszDGkwtA3q-5lz1TxGwKdL=w1238-h928-no?authuser=0";
        this.DOGGO2 = "https://lh3.googleusercontent.com/10EsBINt0tqsyJ_IOR_I71S4MjcmZTrUI-Zp_heNDPNPLBdmgArgReAqSBtaQj2p3ox9FYWOSi5SyCsVLqsEsVBAmJEz3NrGHDqC6FDawSJ25-Rv4lNVhpjRqfDf9Y0OECSn5M4p0zLKqo_vCeFzznXgYgN6c3NONxoAaYhPmiTFI8z6xwAP19s-nLo4AbvP6zvfIuZ58iv3wk2pN2lBdkZlKF5UfpoVWEP1-cxZ4NumJvthfPowcO9L0lALt911aVCGXTuevThyWB7Sr_E_wXf9wgNVgX0iQO2iP1meWyILBowPu6zeue6i2uOJhS8ptAIRfSm2EHaf-4oZdRO4QrkwkhJQYSnR5FLSQxr4e5oADdQJHIhcsuFj7DGxRmzeHw5DJg0CpiDKRIeYTGjVLwZ-UZyrIuJkfT6WBtCT43HKuRJgM_73oiF8dTOy58veQPV43DcdepBXP9gGNrrPuL1NwjWYF1GrZHxblSkmMsZi_V4bZmAZlW0dOFDBrA36C_2p99y-CSCEccpIb7g8FtMCChymNaKiti3nRpWSuAVTMxaT7HjOic_4DmM5tLbs6IEOdtWvx8SYtOuSkV7qwoa3wHE5qHDRumJjynBtszTPtGIUNgaaeWIdb2p8JXL-wK0B-biBLO4Rq1zLEBD7EhthcSpK1yzF9mnM3aXYwde2wL2N8Szke2jxxi4Vrw=w696-h928-no?authuser=0";

    }

    /**
     * Stops the game
     */
    stop() {
        this.running = false;
    }

    /**
     * @async
     * @param {Discord.Message} message - the message that was received
     * @param {string[]} args - arguments
     */
    async onTTT (message, args) {

        try {
            if (args[0] === "COM") {
                throw "Computer not set up."
            } else if (args[0] && args[0].endsWith(">") && args[0].startsWith("<@!")) {
                this.players[1] = message.author.id;
                this.players[2] = args[0].slice(3,args[0].length - 1);
            } else {
                throw "Invalid arg";
            }

            this.playersmessage = await message.channel.send(`Player 1: <@!${this.players[1]}>, Player 2: <@!${this.players[2]}>`);
            this.currplayer = await message.channel.send("Please wait for the emojis to load...")
            this.actualboard = await message.channel.send("Please wait for the emojis to load...");
            this.movesboard = await message.channel.send("Please wait for the emojis to load...");
            this.embed = await message.channel.send("Info:");


            let promises = [];
            for (const emoji of ALPHABETEMOJIS.slice(0,9)) {

                promises.push(this.embed.react(emoji));

            }

            await Promise.all(promises);

        } catch(err) {
            message.reply("There was an error.");
            return;
        }

        this.clear();
        await this.sendTurn();

    }

    /**
     * 
     */
    clear() {
        this.ttt.clear();
        this.running = true;
    }

    ended() {
        return !this.running;
    }

    /**
     * @return
     */
    createEmbed() {
        return new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Tic Tac Toe')
            .setURL('https://photos.app.goo.gl/78opUCCzf6ZmJzDh8')
            .setAuthor('PeepsBot', this.DOGGO2, 'https://photos.app.goo.gl/78opUCCzf6ZmJzDh8')
            .setDescription('Playing TTT. Please wait until all the reactions have been finished before reacting yourself.')
            .setThumbnail(this.DOGGO1)

            .addFields({
                name: "Player",
                value: this.ttt.getPlayer()
            })

            .setTimestamp()
            .setFooter('TTT', this.DOGGO2);
    }

    /**
     * @param {Discord.Collection} collected
     */
    moveWith(collected) {
        const reaction = collected.first().emoji.name;
        this.ttt.moveWithEmoji(reaction);

        if (this.ttt.ended()) {
            // this.embed.reply(this.ttt.statusText());
            this.running = false;
            this.end();
        } else {
            this.sendTurn();
        }
    }

    /**
     * 
     */
    async end() {
        await this.ttt.get();

        const { text, moves, emojitext, emojis, emojimoves } = this.ttt.representations();

        this.currplayer.edit(this.ttt.statusText());
        this.actualboard.edit(emojitext)
        this.movesboard.delete();

        const embed = this.createEmbed();

        await this.embed.edit(embed);
    }

    /**
     * 
     */
    sendError(){
        if (!this.ended()) {
            this.embed.channel.send("<@!" + this.players[this.ttt.turn] + ">, you didn't react.");

            this.ttt.pass();

            this.sendTurn();
        }
    }

    /**
     * @async
     */
    async sendTurn() {

        if(!this.running) return;

        await this.ttt.get();

        const { text, moves, emojitext, emojis, emojimoves } = this.ttt.representations();
        
        this.currplayer.edit(`It's Player ${this.ttt.turn}'s turn.`)
        this.actualboard.edit(emojitext)
        this.movesboard.edit(emojimoves)

        const embed = this.createEmbed();

        await this.embed.edit(embed);

        const filter = (reaction, user) => {
            return emojis.includes(reaction.emoji.name) && user.id === this.players[this.ttt.turn];
        };

        this.embed.awaitReactions(filter, { max: 1, time: 60000, errors: ['time'] })
            .then(collected => {
                this.moveWith(collected);
            })
            .catch(collected => {
                this.sendError();
            });
    }

}

class ProcessorBot {

    /**
     * @constructor
     * @param {google.auth.OAuth2} auth 
     */
    constructor(auth) {

        this.sheets = google.sheets({ version: 'v4', auth });

        this.ref = db.ref("TTT");
        this.ref.set([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
        this.ttt = new TTTbot(this.ref);

        this.destroy = [];
        this.prefix = "!"

        this.daysmap = new Map();

        this.groovySheetID = "1dBQuwHZ35GSpFDuwT_9xQRErFRwCuAO6ePiH_aAIOyU"
        this.todaySheetID = ""

        this.quoteID = "1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM"
        this.quoteSheetID = ""

        this.colors = [this.RGBtoObj(255, 0, 0), this.RGBtoObj(255, 255, 0), this.RGBtoObj(0, 255, 0), this.RGBtoObj(0, 255, 255), this.RGBtoObj(0, 0, 255), this.RGBtoObj(255, 0, 255), this.RGBtoObj(255, 150, 0), this.RGBtoObj(0, 0, 0)]
    
        this.getSheetIDs();

        this.onConstruct();
    }

    async onConstruct(){
        await this.getdays();

        await this.readList(this.getTodayStr())
    }

    RGBtoObj(r, g, b) {
        return {
            red: r / 255,
            green: g / 255,
            blue: b / 255
        }
    }

    /**
     * 
     */
    async getdays() {
        let getdata = (await this.sheets.spreadsheets.get({ spreadsheetId: this.groovySheetID }));

        ;const [today, todaystr] = this.getNow();

        this.daysmap.clear();
        for (const curr of getdata.data.sheets) {
            this.daysmap.set(curr.properties.title, curr.properties.sheetId)

            if(curr.properties.title === todaystr) {
                this.todaySheetID = curr.properties.sheetId
            }
        }

        await this.addday();
        await this.formatPage();
    }

    getNow() {
        let today = moment.tz("America/Los_Angeles")
        let todaystr = today.format("ddd MM/DD/YYYY")
        
        return [today,todaystr]
    }

    getTodayStr(){
        return this.getNow()[1];
    }

    async readList(listname) {
        if(this.daysmap.has(listname)) {
            let currsheetid = this.daysmap.get(listname)
            let res = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.groovySheetID,
                range: `${listname}!A2:B`
            })
            let rows = res.data.values;
            // console.log(rows);
            return rows;
        } else {
            throw "Wait, that's illegal."
        }
    }

    /**
     * 
     * @param {String} listname 
     * @param {Discord.Message} message
     */
    async playList(listname,message) {
        let list = await this.readList(listname);
        await message.channel.send("-play " + list[0][0]);
    }

    async addday() {

        ;const [today, todaystr] = this.getNow();

        if (!this.daysmap.has(todaystr)) {
            let requests = [];

            requests.push({
                addSheet: {
                    properties: {
                        title: todaystr,
                        tabColor: this.colors[today.day()]
                    }
                }
            })

            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.groovySheetID,
                resource: { requests },
            });

            await this.getdays();

        }

    }

    async formatPage() {
        let requests = [];

        requests.push( {
            update_sheet_properties: {
                properties: {
                    sheet_id: this.todaySheetID,
                    grid_properties: {
                        frozen_row_count: 1
                    }
                },
                fields: 'gridProperties.frozenRowCount'
            }
        })

        requests.push({
            "updateDimensionProperties": {
                "range": {
                    "sheetId": this.todaySheetID,
                    "dimension": "COLUMNS",
                    "startIndex": 0,
                    "endIndex": 2
                },
                "properties": {
                    "pixelSize": 600
                },
                "fields": "pixelSize"
            }
        },)

        requests.push({
            updateCells: {
                "rows": [{
                    values: [{
                        userEnteredValue: {
                            stringValue: "Title"
                        }
                    }, {
                        userEnteredValue: {
                            stringValue: "Link"
                        }
                    }]
                }],
                fields: "*",
                range: {
                    "sheetId": this.todaySheetID,
                    "startRowIndex": 0,
                    "endRowIndex": 1,
                    "startColumnIndex": 0,
                    "endColumnIndex": 2
                },
            }
        })

        requests.push({
            repeatCell: {
                range: {
                    sheetId: this.todaySheetID,
                    startRowIndex: 0,
                    endRowIndex: 1
                },
                cell: {
                    userEnteredFormat: {
                        horizontalAlignment: "CENTER",
                        textFormat: {
                            bold: true
                        }
                    }
                },
                "fields": "userEnteredFormat(textFormat,horizontalAlignment)"
            }
        });

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.groovySheetID,
            resource: {
                requests
            },
        });
    }

    async getSheetIDs() {
        this.quoteSheetID = "";
        let getdata = (await this.sheets.spreadsheets.get({ spreadsheetId: this.quoteID }));
        for (const curr of getdata.data.sheets) { 
            this.quoteSheetID = curr.properties.sheetId
        }
    }

    async addGroovyEntry(title,link) {
        let requests = [];

        requests.push({
            appendCells: {
                "sheetId": this.todaySheetID,
                "rows": [
                    { 
                        values: [ {
                            userEnteredValue: {
                                stringValue: title
                            }
                        }, {
                            userEnteredValue: {
                                stringValue: link
                            }
                        }]
                    }
                ],
                fields: "*"
            }
        })

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.groovySheetID,
            resource: {
                requests
            },
        });
    }

    stripQuotes(txt) {
        if(txt.startsWith('"')) {
            txt = txt.slice(1,txt.length - 1)
        }
        return txt;
    }

    async readLittleQuotes() {
        
        let res = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.quoteID,
            range: `Sheet1!A2:B`
        })
        let rows = res.data.values;

        for (const row of rows) {
            row[0] = this.stripQuotes(row[0])
        }

        return rows;
    
    }

    async addLittleQuote(quote,stars) {

        quote = this.stripQuotes(quote);

        let alreadydone = await this.readLittleQuotes();
        let line = -1;

        for(let i = 0; i < alreadydone.length; i++ ){
            if(alreadydone[i][0] === quote) {
                line = i+2;
            }
        }

        if(line === -1) {
            let requests = [];

            requests.push({
                appendCells: {
                    "sheetId": this.quoteSheetID,
                    "rows": [{
                        values: [{
                            userEnteredValue: {
                                stringValue: quote
                            }
                        }, {
                            userEnteredValue: {
                                numberValue: stars
                            }
                        }]
                    }],
                    fields: "*"
                }
            })

            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.quoteID,
                resource: {
                    requests
                },
            });
        } else {

            let requests = [];

            requests.push({
                updateCells: {
                    "rows": [{
                        values: [{
                            userEnteredValue: {
                                stringValue: quote
                            }
                        }, {
                            userEnteredValue: {
                                numberValue: stars
                            }
                        }]
                    }],
                    fields: "*",
                    range: {
                        "sheetId": this.quoteSheetID,
                        "startRowIndex": line-1,
                        "endRowIndex": line,
                        "startColumnIndex": 0,
                        "endColumnIndex": 2
                    },
                }
            })

            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.quoteID,
                resource: {
                    requests
                },
            });
        }
    }

    async randomLittleQuote() {
        let quotes = await this.readLittleQuotes();

        let total = 0;
        for (const row of quotes) {
            total += parseInt(row[1]);
        }
        let randomnum = Math.random() * total;

        for(const row of quotes) {
            randomnum -= parseInt(row[1])
            if(randomnum <= 0) {
                return row[0];
            }
        }
    }

    /**
     * 
     * @param {string} txt1 
     * @param {string} txt2 
     */
    similarities(txt1, txt2) {

        if(txt1.startsWith("\"")) {
            txt1 = txt1.slice(1,txt1.length-1)
        }
        if (txt2.startsWith("\"")) {
            txt2 = txt2.slice(1, txt2.length - 1)
        }

        let words1 = txt1.toLowerCase().split(" ");
        let words2 = txt2.toLowerCase().split(" ");

        let similarities = 0;

        for(const word of words1) {
            if(words2.indexOf(word) !== -1) similarities ++;
        }
        return similarities
    }

    async notRandomLittleQuote(messagecontent) {
        let quotes = await this.readLittleQuotes();

        let probs = [];
        let total = 0;
        for (let i = 0; i < quotes.length; i++) {
            const row = quotes[i];
            probs.push(this.similarities(row[0],messagecontent));
            total += probs[i];
        }

        let currtotal = Math.random() * total;
        if(total === 0){
            return "Sorry, I'm not sure what to think about that."
        }
        for (let i = 0; i < quotes.length; i++) {
            currtotal -= probs[i];
            if(currtotal <= 0) {
                return quotes[i][0]
            }
        }
        return "Error"
    }

    /**
     * @param {String} txt 
     */
    async processPlayMessage(txt){
        if(txt.startsWith("[")) {
            let endtitle = txt.indexOf("](");
            let title = txt.slice(1,endtitle);

            let startlink = endtitle + 2;
            let endlink = txt.indexOf(") [<@")
            let link = txt.slice(startlink,endlink);

            await this.addday();

            await this.addGroovyEntry(title,link)
        }
    }

    /**
     * 
     * @param {Discord.Message} message
     */
    async onMessage(message) {

        for(const id of this.destroy) {
            if(message.author.id === id) {
                message.delete();
            }
        }

        if (message.author.bot) {
            if(message.embeds[0]){

                let prevmsg = await message.channel.messages.fetch({
                    limit: 2
                })
                let keys = prevmsg.keys()
                keys.next();
                let prevmsgkey = keys.next().value;
                let content = prevmsg.get(prevmsgkey).content

                if(!content.startsWith("-np")){
                    (this.processPlayMessage(message.embeds[0].description))
                }

            }
            
            return;
        };

        if (!message.content.startsWith(this.prefix)) return;

        const commandBody = message.content.slice(this.prefix.length);
        const args = commandBody.split(' ');
        const command = args.shift().toLowerCase();

        if (command === "stopttt") {
            this.ttt.stop();
            message.react("✅");
        }

        if(command === "help") {
            message.reply("This bot is new. The only commands are !TTT and !STOPTTT.")
        }

        if(command === "playfirstsongofplaylist") {
            try {
                this.playList(args[0] + " " + args[1], message)
            } catch (err) {
                message.reply(err);
            }
        }

        if(command === "littlerr") {
            let testSet = args.join(" ");
            testSet = testSet.replace(/.\?/, "")
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

            let stuff = nn.run(testSet);
            let maxval = -1;
            let maxind = 0;
            for(let i = 0; i < stuff.length; i++){
                if(stuff[i] > maxval) {
                    maxval = stuff[i];
                    maxind = i;
                }
            }

            message.channel.send(outputs[maxind])
        }
        
        if(command === "cache") {
            message.channel.messages.fetch({
                limit: 90
            });
            message.react("✅")
        }

        if(command === "spreadsheets") {
            message.reply(`Spreadsheets: Little Quotes: <https://docs.google.com/spreadsheets/d/1I7_QTvIuME6GDUvvDPomk4d2TJVneAzIlCGzrkUklEM/edit#gid=0>,\nOur Groovy History: <https://docs.google.com/spreadsheets/d/1dBQuwHZ35GSpFDuwT_9xQRErFRwCuAO6ePiH_aAIOyU/edit#gid=1430553805>`)
        }

        if(command === "little") {
            message.channel.send(await this.randomLittleQuote());
        }

        if(command === "littler") {
            message.channel.send(await this.notRandomLittleQuote(args.join(" ")))
        }

        if (command === "ttt") {

            this.ttt.onTTT(message, args);

        }
    }

    /**
     * 
     * @param {Discord.MessageReaction} reaction 
     * @param {*} user 
     */
    async onReaction(reaction, user) {

        
        if (reaction.message.channel.id !== "754912483390652426" && reaction.message.channel.id !== "756698378116530266") return;

        // When we receive a reaction we check if the reaction is partial or not
        if (reaction.partial) {
            // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                // Return as `reaction.message.author` may be undefined/null
                return;
            }
        }

        // // Now the message has been cached and is fully available
        // // The reaction is now also fully available and the properties will be reflected accurately:
        // console.log(`${reaction.count} user(s) have given the same reaction to this message!`);
        
        if (reaction.emoji.name === "👍") {
            this.addLittleQuote(reaction.message.content, reaction.count)
            console.log(`${reaction.message.author}'s message "${reaction.message.content}" gained a reaction!`);
        }

        
    }
}

let STARTUP = function(sheets){


    for (let i = 0; i < 1000; i++) {
        nn.batchTrainOnce()
    }

    let processorbot = new ProcessorBot(sheets);

    console.log("Up now!")

    client.on("message", async function (message) {
        processorbot.onMessage(message)
    });

    client.on("messageReactionAdd", async function(reaction, user){
        await processorbot.onReaction(reaction, user)
    })

    client.on("messageReactionRemove", async function(reaction,user){
        await processorbot.onReaction(reaction,user)
    })

    client.login(config);

}

authorize({
    installed: {
        client_id: process.env.client_id_googleoath,
        project_id: process.env.project_id_googleoath,
        auth_uri: process.env.auth_uri_googleoath,
        token_uri: process.env.token_uri_googleoath,
        auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url_googleoath,
        client_secret: process.env.client_secret_googleoath,
        redirect_uris: [process.env.redirect_uris1_googleoath, process.env.redirect_uris2_googleoath]
    }
}, STARTUP);
