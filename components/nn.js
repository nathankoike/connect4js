const alpha = 0.5; // Just some constant alpha, changing this does stuff
const maxEpochs = 1000; // The most training cycles that can be done in one shot

// value: the Number to run through the function
// Returns a Number
function sigmoid(value) {
  try {
    return 1 / (1 + Math.exp(-value));
  } catch (err) {
    return 0;
  }
}

// layer: an array of arrays of Numbers, where each subarray is a node
// input: an array of Numbers
// Returns an array of the dot product of every node run through the sigmoid fn
function activateLayer(layer, input) {
  return layer.map(([weights], bias) =>
    sigmoid(
      weights
        .map((weight, i) => weight * input[i]) // node[i] * input[i]
        .reduce((prev, curr) => prev + curr) + bias // Sum for dot product
    )
  );
}

//     nn: an array of arrays of arrays of weights
//         [layer1, layer2, ..., layer_n], where each layer is an array of nodes
//         [node1, node2, ..., node_m], where each node is an array of weights
//         [weight1, weight2, ..., weight_i], where each weight is a Number
//  input: an array of size n, where n is the size of a node in the first layer
// Returns the activation result of the final layer
function predict(nn, input) {
  return nn.length ? predict(nn.slice(1), activateLayer(nn[0], input)) : input;
}

// neuralNetwork: the neural net we want to train
//  deltaNetwork: delta values with the same structure as NeuralNetwork
//                [layer1Deltas, layer2Deltas, ..., layer_nDeltas]
//                [node1Delta, node2Delta, ..., node_mDelta]
//       Returns: a neural network that has been tuned by the delta network
function update(neuralNetwork, deltaNetwork) {
  // These are in reverse order, so we need to flip them
  neuralNetwork.reverse();
  deltaNetwork.reverse();

  return neuralNetwork.map((layer, i) =>
    layer.map(([weights, bias], j) => [
      weights.map(
        weight => weight + deltaNetwork[i][j] * (alpha + alpha * alpha)
      ),
      bias + alpha * deltaNetwork[i][j]
    ])
  );
}

//       nn: the neural network we want to train
//   result: the result of our neural network
// expected: the actual answer
//  Returns: a neural network that has been modified by back propagation on a
//           single training case
function backprop(nn, result, expected) {
  nn.reverse(); // Output layer first

  // The deltas of every node in every layer
  let deltaNetwork = [];

  nn.forEach((layer, i) => {
    // Not output layer
    if (i) {
      deltaNetwork.push(
        layer.map(node =>
          nn[i - 1]
            .map(([nextWeights, bias], j) =>
              nextWeights
                .map(weight => weight * deltaNetwork[i - 1][j])
                .reduce((prev, curr) => prev + curr)
            )
            .reduce((prev, curr) => prev + curr)
        )
      );
    }

    // Output layer
    else {
      deltaNetwork.push(
        layer.map((node, j) => {
          return result[j] * (1 - result[j]) * (expected[j] - result[j]);
        })
      );
    }
  });

  return update(nn, deltaNetwork);
}

//      nn: an unnecessarily functional neural network
//    data: the test data set; each entry is in the form [input, output]
//  epochs: the number of loops to perform
// Returns: a trained neural network of the same form as the input network
function train(nn, data, epochs) {
  if (epochs > maxEpochs) epochs = maxEpochs;
  if (epochs < 1) return nn; // Base case

  // Update the weights in the NN for every training case
  data.forEach(([input, output]) => {
    nn = backprop(nn, predict(nn, input), output);
  });

  return train(nn, data, --epochs); // Loop
}

//    layers: an array of integers where each entry is the number of nodes in a
//            layer
// inputSize: the number of inputs the neural network is expected to take
//   Returns: a neural network as outlined in the predict function header
function unfunn(inputSize, layers) {
  return layers.map((nodes, i) => {
    // The current layer being built
    let layer = [];

    // Build all the nodes
    for (; nodes; --nodes) {
      let node = [];

      // Assign a random value to each weight
      for (let weights = i ? layers[i - 1] : inputSize; weights > 0; --weights)
        node.push(Math.random());

      layer.push([node, alpha]);
    }

    return layer;
  });
}

module.exports = {
  train,
  predict,
  unfunn
};
