import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import axios from 'axios';

const prompts = {
  "Basic Prompt": {
    template: "Respond to the following query: {input}",
    samples: [
      "What is the capital of France?",
      "Explain quantum computing in simple terms"
    ]
  },
  "Creative Writer": {
    template: "Write a creative story about: {input}",
    samples: [
      "A robot learning to love",
      "A haunted mansion in the 22nd century"
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

  useEffect(() => {
    axios.get('https://openrouter.ai/api/v1/models')
      .then(res => setModels(res.data.data))
      .catch(console.error);
  }, []);

  const handleRunSim = async () => {
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
  };

  const handleImprovePrompt = async () => {
    if (!feedback) return alert('Please provide feedback first');

    const improvementPrompt = `Current prompt: ${promptText}
    User Feedback: ${feedback}
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
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
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


// 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