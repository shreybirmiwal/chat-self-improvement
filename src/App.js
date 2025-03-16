import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import axios from 'axios';


const prompts = {
  "should_discard_memory": {
    template: `
      You will be given a conversation transcript, and your task is to determine if the conversation is worth storing as a memory or not. 
      It is not worth storing if there are no interesting topics, facts, or information, in that case, output discard = True.

      Transcript: {input}
    `,
    samples: [
      "A: Hey, how are you? B: I'm good, how about you? A: I'm good too.",
      "A: What's your favorite color? B: Blue. A: Mine is red."
    ]
  },

  "retrieve_is_an_omi_question": {
    template: `
    Task: Analyze the question to identify if the user is inquiring about the functionalities or usage of the app, Omi or Friend. Focus on detecting questions related to the app's operations or capabilities.

    Examples of User Questions:

    - "How does it work?"
    - "What can you do?"
    - "How can I buy it?"
    - "Where do I get it?"
    - "How does the chat function?"

    Instructions:

    1. Review the question carefully.
    2. Determine if the user is asking about:
     - The operational aspects of the app.
     - How to utilize the app effectively.
     - Any specific features or purchasing options.

    Output: Clearly state if the user is asking a question related to the app's functionality or usage. If yes, specify the nature of the inquiry.

    User's Question: {input}
    `,
    samples: [
      "What is the capital of France?",
      "What is the meaning of life?"
    ]
  }


};

const App = () => {
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(Object.keys(prompts)[0]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [inputData, setInputData] = useState('');
  const [promptText, setPromptText] = useState(prompts[Object.keys(prompts)[0]].template);
  const [output, setOutput] = useState('');
  const [feedback, setFeedback] = useState('');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    axios.get('https://openrouter.ai/api/v1/models')
      .then(res => setModels(res.data.data))
      .catch(console.error);
  }, []);

  const handleRunSim = async () => {
    setIsLoading(true);
    const fullPrompt = promptText.replace('{input}', inputData);

    try {
      const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: selectedModel,
        messages: [{ role: "user", content: fullPrompt }]
      }, {
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json'
        }
      });

      setOutput(res.data.choices[0].message.content);
      setHistory([{
        timestamp: new Date().toISOString(),
        action: 'Simulation Run',
        details: `Model: ${selectedModel}, Prompt: ${selectedPrompt}`
      }, ...history]);
    } catch (err) {
      console.error(err);
      alert('Error running simulation');
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleImprovePrompt = async () => {
    setIsLoading(true);
    if (!feedback) return alert('Please provide feedback first');

    const improvementPrompt = `Current prompt: ${promptText}
    User Feedback: ${feedback}
    Previous Input; ${inputData}
    Previous Output: ${output}
    
    Please improve the prompt based on the feedback. Respond with ONLY the new improved prompt, no other text.`;

    try {
      const res = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        model: selectedModel,
        messages: [{ role: "user", content: improvementPrompt }]
      }, {
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json'
        }
      });

      const newPrompt = res.data.choices[0].message.content;
      setPromptText(newPrompt);
      setFeedback('');
      setHistory([{
        timestamp: new Date().toISOString(),
        action: 'Prompt Improved',
        details: `New prompt: ${newPrompt}`
      }, ...history]);
    } catch (err) {
      console.error(err);
      alert('Error improving prompt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-t-transparent border-blue-500"></div>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <input
            type="password"
            placeholder="OpenRouter API Key"
            className="border p-2 rounded w-full mb-4"
            value={openRouterKey}
            onChange={(e) => setOpenRouterKey(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-4 mb-4">
            <select
              className="border p-2 rounded"
              value={selectedPrompt}
              onChange={(e) => {
                const promptKey = e.target.value;
                setSelectedPrompt(promptKey);
                setPromptText(prompts[promptKey].template);
                setInputData(''); // Reset input when changing prompt
              }}
            >
              {Object.keys(prompts).map(prompt => (
                <option key={prompt} value={prompt}>{prompt}</option>
              ))}
            </select>

            <select
              className="border p-2 rounded"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="">Select Model</option>
              {models.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>

            <select
              className="border p-2 rounded"
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
            >
              <option value="">Select Sample Data</option>
              {prompts[selectedPrompt]?.samples.map((sample, i) => (
                <option key={i} value={sample}>{`Sample ${i + 1}`}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleRunSim}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Run Sim
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm h-96">
            <h2 className="text-lg font-semibold mb-4">Input Data</h2>
            <textarea
              className="w-full h-64 p-2 border rounded"
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="Enter input data or select sample"
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm h-96">
            <h2 className="text-lg font-semibold mb-4">Prompt</h2>
            <textarea
              className="w-full h-64 p-2 border rounded"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm h-96 flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Output</h2>
            <div className="p-2 border rounded h-48 overflow-y-auto mb-4">
              {output || "Output will appear here"}
            </div>
            <div className="flex-1">
              <textarea
                className="w-full h-24 p-2 border rounded mb-2"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Type your feedback here..."
              />
              <button
                onClick={handleImprovePrompt}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
              >
                Submit Feedback & Improve Prompt
              </button>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Action History</h2>
          <div className="space-y-2">
            {history.map((entry, i) => (
              <div key={i} className="border-b pb-2">
                <div className="text-sm text-gray-500">{new Date(entry.timestamp).toLocaleString()}</div>
                <div className="font-medium">{entry.action}</div>
                <div className="text-sm text-gray-600">{entry.details}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

