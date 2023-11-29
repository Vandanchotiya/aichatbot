
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const OpenAI = require('openai');
const fs = require("fs");
const pdfParse = require("pdf-parse");
const ExcelJS = require("exceljs");
const https = require("https");
const os = require("os");
const path = require("path");
const cors = require('cors');
const { async } = require("replace/bin/shared-options");

const app = express();
app.use(express.json());
app.use(cors());
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const databaseFilePath = "./embeddings_database.xlsx";
const databaseFilePath1 = "./embeddings_database1.xlsx";
const workbook = new ExcelJS.Workbook();

async function extractTextFromPdf(file) {
  const dataBuffer = fs.readFileSync(file);
  console.log(dataBuffer);
  const pdfData = await pdfParse(dataBuffer);
  console.log(pdfData);
  const pddata = pdfData.text;
  console.log(pddata);
  return pddata;
}



async function getExcelData() {
  try {
    await workbook.xlsx.readFile('./embeddings_database.xlsx');
    
    const worksheet = workbook.getWorksheet(1); // Assuming data is in the first worksheet

    const recordsHash = {};
    worksheet.eachRow((row, rowNumber) => {
      recordsHash[row.getCell(1).value] = row.getCell(2).value;
      // Change row.getCell(1) and row.getCell(2) to correspond to your columns
      // Assuming Text is in column 1 and Embedding is in column 2
    });

    return recordsHash;
  } catch (error) {
    console.log(error.message);
    return {};
  }
}

async function getExcelData1() {
  try {
    await workbook.xlsx.readFile('./embeddings_database1.xlsx');
    
    const worksheet = workbook.getWorksheet(1); // Assuming data is in the first worksheet

    const recordsHash = {};
    worksheet.eachRow((row, rowNumber) => {
      recordsHash[row.getCell(1).value] = row.getCell(2).value;
      // Change row.getCell(1) and row.getCell(2) to correspond to your columns
      // Assuming Text is in column 1 and Embedding is in column 2
    });

    return recordsHash;
  } catch (error) {
    console.log(error.message);
    return {};
  }
}

function cosineSimilarity(A, B) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < A.length; i++) {
    dotProduct += A[i] * B[i];
    normA += A[i] * A[i];
    normB += B[i] * B[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  return dotProduct / (normA * normB);
}

// function getSimilarityScore(embeddingsHash, promptEmbedding) {
//   console.log("Prompt Embedding:", promptEmbedding); // Check the format and content of the prompt embedding
//   const similarityScoreHash = {};
//   Object.keys(embeddingsHash).forEach((text) => {
//     const storedEmbedding = JSON.parse(embeddingsHash[text]);
//     console.log("Stored Embedding:", storedEmbedding); // Check the format and content of stored embeddings
//     similarityScoreHash[text] = cosineSimilarity(promptEmbedding, storedEmbedding);
//     console.log(`Similarity Score for ${text}:`, similarityScoreHash[text]); // Check individual similarity scores
//   });
//   return similarityScoreHash;
// }

function getSimilarityScore(embeddingsHash, promptEmbedding) {
  const similarityScoreHash = {};
  Object.keys(embeddingsHash).forEach((text) => {
    similarityScoreHash[text] = cosineSimilarity(
      promptEmbedding,
      JSON.parse(embeddingsHash[text])
    );
  });
  return similarityScoreHash;
}


// async function saveToExcel(text, embedding) {
//   try {
//     const workbook = new ExcelJS.Workbook();
//     let worksheet;

//     if (fs.existsSync(databaseFilePath)) {
//       await workbook.xlsx.readFile(databaseFilePath);
//       worksheet = workbook.getWorksheet("Embeddings");
//     } else {
//       worksheet = workbook.addWorksheet("Embeddings");
//       worksheet.addRow(["Text", "Embedding"]);
//     }

//     worksheet.addRow([text, embedding]);
//     await workbook.xlsx.writeFile(databaseFilePath);
//     console.log("Embedding saved to Excel database.");
//   } catch (error) {
//     console.error("Error saving to Excel:", error);
//   }
// }

async function saveToExcel(text, embedding) {
    try {
      const workbook = new ExcelJS.Workbook();
      let worksheet;
  
      if (fs.existsSync(databaseFilePath)) {
        await workbook.xlsx.readFile(databaseFilePath);
        worksheet = workbook.getWorksheet("Embeddings");
      } else {
        worksheet = workbook.addWorksheet("Embeddings");
        worksheet.addRow(["Embedding"]);
      }
  
      worksheet.addRow([embedding]);
      await workbook.xlsx.writeFile(databaseFilePath);
      console.log("Embedding saved to Excel database.");
    } catch (error) {
      console.error("Error saving to Excel:", error);
    }
  }

  async function saveToExcel1(embedding) {
    try {
      const workbook = new ExcelJS.Workbook();
      let worksheet;
  
      if (fs.existsSync(databaseFilePath1)) {
        await workbook.xlsx.readFile(databaseFilePath1);
        worksheet = workbook.getWorksheet("Embeddings");
      } else {
        worksheet = workbook.addWorksheet("Embeddings");
        worksheet.addRow(["Embedding"]);
      }
  
      worksheet.addRow([embedding]);
      await workbook.xlsx.writeFile(databaseFilePath1);
      console.log("Embedding saved to Excel database 1.");
    } catch (error) {
      console.error("Error saving to Excel:", error);
    }
  }

async function getEmbedding() {
  try {
    const pdfContent = await extractTextFromPdf("./sample1.pdf");
    console.log(pdfContent);

    const data = JSON.stringify({
      input: pdfContent,
      model: "text-embedding-ada-002",
      encoding_format: "float",
    });

    const options = {
      hostname: "api.openai.com",
      path: "/v1/embeddings",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, async (res) => {
      let responseBody = "";
      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", async () => {
        //console.log("Response:", responseBody);

 //       Parse the response to extract the embedding
        //console.log(responseBody);
        const response = JSON.parse(responseBody);
        //console.log(response);
        const embedding = JSON.stringify(response.data);
        //console.log(embedding);
        // Save the embedding along with the text to the Excel database
        await saveToExcel(pdfContent, embedding);
      });
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
    });

    req.write(data);
    req.end();
  } catch (error) {
    console.error("Error:", error);
  }
}

//getEmbedding();

async function getdata(userQuery) {
  try {

    // getting text and embeddings data from excel
    const embeddingsHash = await getExcelData();

  const data = JSON.stringify({
    input: userQuery,
    model: "text-embedding-ada-002",
    encoding_format: "float",
  });

  const options = {
    hostname: "api.openai.com",
    path: "/v1/embeddings",
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
  };

    const req = https.request(options, async (res) => {
      let responseBody = "";
      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", async () => {
        try {
          const response = JSON.parse(responseBody);
          const embedding = JSON.stringify(response.data);
          await saveToExcel1(embedding);

          const promptHash = await getExcelData1();
          const similarityScoreHash = getSimilarityScore(embeddingsHash, promptHash);

          const textWithHighestScore = Object.keys(similarityScoreHash).reduce(
            (a, b) => (similarityScoreHash[a] > similarityScoreHash[b] ? a : b)
          );

          const finalPrompt = `
            Info: ${textWithHighestScore}
            Question: ${userQuery}
            Answer:
          `;
          console.log(finalPrompt);

          const chatCompletion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: finalPrompt }],
            model: 'gpt-3.5-turbo',
          });

          const choices = chatCompletion.choices;
          if (choices && choices.length > 0) {
            const response = choices[0].message.content;
            console.log(response);
          } else {
            console.error('No valid choices found in the response.');
          }
        } catch (error) {
          console.error("Error processing data:", error);
        }
      });
    });

    req.on("error", (error) => {
      console.error("Request error:", error);
    });

    req.write(data);
    req.end();

  } catch (error) {
    console.error("Error:", error);
  }
}


app.post("/api/chat", async (req, res) => {

  const { userQuery } = req.body;

 res = await getdata(userQuery);
 console.log(res);

   
});

app.listen(4000, () => {
  console.log('Server running on port 4000');
});

// async function getdata(userQuery)
// {
//   try {

//     // getting text and embeddings data from excel
//     const embeddingsHash = await getExcelData();

//   const data = JSON.stringify({
//     input: userQuery,
//     model: "text-embedding-ada-002",
//     encoding_format: "float",
//   });

//   const options = {
//     hostname: "api.openai.com",
//     path: "/v1/embeddings",
//     method: "POST",
//     headers: {
//       "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
//       "Content-Type": "application/json",
//     },
//   };

//   const req1 = https.request(options, async (res) => {
//     let responseBody = "";
//     res.on("data", (chunk) => {
//       responseBody += chunk;
//     });

//     res.on("end", async () => {

//         const response = JSON.parse(responseBody);
    
//         const embedding = JSON.stringify(response.data);
     
//         // Save the embedding along with the text to the Excel database
//         await saveToExcel1(embedding);

//         const promptHash = await getExcelData1();

//         const similarityScoreHash = getSimilarityScore(
//           embeddingsHash,
//           promptHash
//         );
//        // console.log(similarityScoreHash);
//             // get text (i.e. key) from score map that has highest similarity score
//     const textWithHighestScore = Object.keys(similarityScoreHash).reduce(
//       (a, b) => (similarityScoreHash[a] > similarityScoreHash[b] ? a : b)
//     );

//    // console.log(textWithHighestScore);

//   const finalPrompt = `
//    Info: ${textWithHighestScore}
//    Question: ${userQuery}
//    Answer:
//  `;
//   console.log(finalPrompt);

//     try {
//     const chatCompletion = await openai.chat.completions.create({
//       messages: [{ role: 'user', content: finalPrompt }],
//       model: 'gpt-3.5-turbo',
//     });
  
//     const choices = chatCompletion.choices;
//     if (choices && choices.length > 0) {
//       const response = choices[0].message.content;
//       console.log(response);
//      // res.json({ response });
//     } else {
//      // res.status(500).json({ error: 'No valid choices found in the response.' });
//     }
  
//   } catch (error) {
//    // res.status(500).json({ error: error.message });
//   }


//     });
//   });
//   req1.on("error", (error) => {
//     console.error("Request error:", error);


//   });
//   req1.write(data);
//   req1.end();


//   } catch (error) {
//     console.log(error.message);
//   }

// }

/************************************************************** */
// const dotenv = require("dotenv");
// dotenv.config();
// const fs = require("fs");
// const pdfParse = require("pdf-parse");
// const axios = require("axios");
// const min_para_words = 5;
// const embeds_storage_prefix = 'embeds:';


// async function extractTextFromPdf(file) {
//   const dataBuffer = fs.readFileSync(file);
//   const pdfData = await pdfParse(dataBuffer);
//   return pdfData.text;
// }

// async function getEmbedding() {
//   try {
//     const sourcePath = './sourceData/sample1.pdf';
//     const destPath = './embeddedData/embeddata.csv';
//     const pdfContent = await extractTextFromPdf(sourcePath);
//     console.log(pdfContent);

//     const payload = {
//       input: pdfContent,
//       model: "text-embedding-ada-002",
//       encoding_format: "float",
//     };

//     const response = await axios.post('https://api.openai.com/v1/embeddings', payload, {
//       headers: {
//         'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     console.log("Response:", response.data);
//     const embeddingStore = {};
//         response.data.data.forEach((item, index) => {
//       const startTime = new Date().getTime();
//       embeddingStore[embeds_storage_prefix + pdfContent[index]] = JSON.stringify({
//         embedding: item.embedding,
//         created: startTime,
//       });
//     });

//     fs.writeFileSync(destPath, JSON.stringify(embeddingStore));
//     //res.json({ message: 'Embedding finished and stored.' });
//   } catch (error) {
//     console.error("Error:", error.response ? error.response.data : error.message);
//   }
// }

// getEmbedding();

/*********************************************************************************** */
// const dotenv = require("dotenv");
// dotenv.config();
// const fs = require("fs");
// const pdfParse = require("pdf-parse");
// const axios = require("axios");

// async function extractTextFromPdf(file) {
//   const dataBuffer = fs.readFileSync(file);
//   const pdfData = await pdfParse(dataBuffer);
//   return pdfData.text;
// }

// async function getEmbedding() {
//   try {
//     const pdfContent = await extractTextFromPdf("./sample1.pdf");
//     console.log(pdfContent);

//     const payload = {
//       input: pdfContent,
//       model: "text-embedding-ada-002",
//       encoding_format: "float",
//     };

//     const response = await axios.post('https://api.openai.com/v1/embeddings', payload, {
//       headers: {
//         'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     console.log("Response:", response.data);
//   } catch (error) {
//     console.error("Error:", error.response ? error.response.data : error.message);
//   }
// }

// getEmbedding();


/********************************************************************************************************** */




// const dotenv = require("dotenv");
// dotenv.config();
// const fs = require("fs");
// const pdfParse = require("pdf-parse");
// const { exec } = require("child_process");

// async function extractTextFromPdf(file) {
//   const dataBuffer = fs.readFileSync(file);
//   const pdfData = await pdfParse(dataBuffer);
//   return pdfData.text;
// }

// async function getEmbedding() {
//   try {
//     const pdfContent = await extractTextFromPdf("./sample1.pdf");
//     console.log(pdfContent);

//     const payload = JSON.stringify({
//       input: pdfContent,
//       model: "text-embedding-ada-002",
//       encoding_format: "float",
//     });

//     const curlCommand = `curl https://api.openai.com/v1/embeddings \
//       -H "Authorization: Bearer ${process.env.OPENAI_API_KEY}" \
//       -H "Content-Type: application/json" \
//       -d '${payload.replace(/'/g, "\\'")}'`;

//     exec(curlCommand, (error, stdout, stderr) => {
//       if (error) {
//         console.error("Error:", error);
//         return;
//       }
//       console.log("Response:", stdout);
//       if (stderr) {
//         console.error("stderr:", stderr);
//       }
//     });
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// getEmbedding();



// const fs = require("fs");
// const pdfParse = require("pdf-parse");
// const { exec } = require("child_process");

// async function extractTextFromPdf(file) {
//   const dataBuffer = fs.readFileSync(file);
//   const pdfData = await pdfParse(dataBuffer);
//   return pdfData.text;
// }

// async function getEmbedding() {
//   try {
//     const pdfContent = await extractTextFromPdf("./sample1.pdf");
//     console.log(pdfContent);

//     const curlCommand = `curl https://api.openai.com/v1/embeddings \
//       -H "Authorization: Bearer ${process.env.OPENAI_API_KEY}" \
//       -H "Content-Type: application/json" \
//       -d '{
//         "input": "${pdfContent.replace(/"/g, '\\"')}",
//         "model": "text-embedding-ada-002",
//         "encoding_format": "float"
//       }'`;

//     exec(curlCommand, (error, stdout, stderr) => {
//       if (error) {
//         console.error("Error:", error);
//         return;
//       }
//       console.log("Response:", stdout);
//       if (stderr) {
//         console.error("stderr:", stderr);
//       }
//     });
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// getEmbedding();


// const dotenv = require("dotenv");
// dotenv.config();

// const OpenAI = require('openai');

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY // This is also the default, can be omitted
// });

// const fs = require("fs");
// const pdfParse = require("pdf-parse");

// async function extractTextFromPdf(file) {
//   const dataBuffer = fs.readFileSync(file);
//   const pdfData = await pdfParse(dataBuffer);
//   return pdfData.text;
// }



// async function getEmbedding() {
//   try {
//       const pdfContent = await extractTextFromPdf("./sample1.pdf");
//       console.log(pdfContent);
//       const response = await openai.embeddings.create({
//           model: "text-embedding-ada-002",
//           input: pdfContent,
//       });

//       if (response && response.data && response.data.data) {
//           console.log(response.data.data);
//           if (response.data.usage && response.data.usage.total_tokens) {
//               console.log(response.data.usage.total_tokens);
//           } else {
//               console.log("Total tokens information not available.");
//           }
//       } else {
//           console.log("No data received from OpenAI.");
//       }
//   } catch (error) {
//       console.error("Error:", error);
//   }
// }
// getEmbedding();

// const dotenv = require("dotenv");
// dotenv.config();

// const OpenAI = require('openai');

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const fs = require("fs");
// const pdfParse = require("pdf-parse");

// async function extractTextFromPdf(file) {
//   const dataBuffer = fs.readFileSync(file);
//   const pdfData = await pdfParse(dataBuffer);
//   return pdfData.text;
// }

// async function getEmbedding() {
//     const pdfContent = await extractTextFromPdf("./sample1.pdf");
//     console.log(pdfContent);
//     const response  = await openai.createEmbedding({
//         model: "text-embedding-ada-002",
//         input: pdfContent,
//     });

//     console.log(response.data.data);
//     console.log(response.data.usage.total_tokens);
// }

// getEmbedding();


// require('dotenv').config();
// const express = require('express');
// const OpenAI = require('openai');
// const fs = require('fs');

// const app = express();
// const cors = require('cors');

// app.use(express.json());
// app.use(cors());

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const min_para_words = 5;
// const embeds_storage_prefix = 'embeds:';

// app.post('/api/chat', async (req, res) => {
//   const { userQuery } = req.body;

//   try {
//     const chatCompletion = await openai.chat.completions.create({
//       messages: [{ role: 'user', content: userQuery }],
//       model: 'gpt-3.5-turbo',
//     });

//     const choices = chatCompletion.choices;
//     if (choices && choices.length > 0) {
//       const response = choices[0].message.content;
//       res.json({ response });
//     } else {
//       res.status(500).json({ error: 'No valid choices found in the response.' });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.get('/api/embed', async (req, res) => {
//   try {
//     const sourcePath = './sourceData/sourceFile.txt';
//     const destPath = './embeddedData/embeddedFile.txt';

//     const rawText = fs.readFileSync(sourcePath, {
//       encoding: 'utf-8',
//       flag: 'r',
//     });
//   //  console.log(rawText);
//     const rawParas = rawText.split(/\n\s*\n/);
//  //   console.log(rawParas);
//     const paras = rawParas
//       .map((para) => para.trim().replaceAll('\n', ' ').replace(/\r/g, ''))
//       .filter(
//         (para) => para.charAt(para.length - 1) !== '?' && para.split(/\s+/).length >= min_para_words
//       );
//    //   console.log(paras);
//     const embeddings = await openai.createEmbedding({
//       input: paras,
//       model: 'text-embedding-ada-002',
//     });
//     console.log(embeddings);
//     const embeddingStore = {};
//     embeddings.data.data.forEach((item, index) => {
//       const startTime = new Date().getTime();
//       embeddingStore[embeds_storage_prefix + paras[index]] = JSON.stringify({
//         embedding: item.embedding,
//         created: startTime,
//       });
//     });

//     fs.writeFileSync(destPath, JSON.stringify(embeddingStore));
//     res.json({ message: 'Embedding finished and stored.' });
//   } catch (error) {
//     console.error('Error during embedding:', error);
//     res.status(500).json({ error: 'Error occurred during embedding.' });
//   }
  
// });

// app.listen(4000, () => {
//   console.log('Server running on port 4000');
// });


// const express = require('express');
// const PDFParser = require('pdf-parse');
// const cors = require('cors');
// const axios = require('axios');
// const ExcelJS = require('exceljs');

// const app = express();
// app.use(cors());
// const port = 4000;

// const apiKey = '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'; // Replace with your actual OpenAI API key
// const textEmbeddingURL = 'https://api.openai.com/v1/engines/text-embedding-ada-002/completions';
// const gptURL = 'https://api.openai.com/v1/engines/gpt-3.5-turbo/completions'; // Updated to use gpt-3.5-turbo

// let workbook;
// let worksheet;

// app.use(express.json());

// app.post('/upload', async (req, res) => {
//   try {
//     if (!req.body || !req.body.pdfBuffer) {
//       throw new Error('PDF buffer not provided.');
//     }

//     const pdfBuffer = req.body.pdfBuffer;

//     // Extract text from PDF
//     const pdfText = await extractTextFromPDF(pdfBuffer);

//     if (!pdfText) {
//       throw new Error('Failed to extract text from the PDF.');
//     }

//     // Get embeddings from text
//     const embeddings = await getEmbeddingsFromText(pdfText);

//     // Create a new Excel workbook and store embeddings in a worksheet
//     workbook = new ExcelJS.Workbook();
//     worksheet = workbook.addWorksheet('PDFEmbeddings');
//     storeEmbeddingsInExcel(embeddings);

//     res.status(200).send('PDF processed and embeddings stored successfully.');
//   } catch (error) {
//     console.error('Error processing PDF:', error); // Log the error
//     res.status(500).send(`Error processing PDF: ${error.message}`);
//   }
// });

// app.post('/ask', async (req, res) => {
//   try {
//     if (!req.body || !req.body.question) {
//       throw new Error('Question not provided.');
//     }

//     const question = req.body.question;

//     // Get embeddings for the question
//     const questionEmbeddings = await getEmbeddingsFromText(question);

//     // Retrieve embeddings from Excel and compare with question embeddings to find relevant data

//     // Use GPT-3 to respond to the question
//     const response = await askGPTQuestion(question);

//     res.status(200).json({ answer: response.data.choices[0].text.trim() });
//   } catch (error) {
//     console.error('Error processing question:', error); // Log the error
//     res.status(500).send(`Error processing question: ${error.message}`);
//   }
// });

// // Helper functions
// async function extractTextFromPDF(pdfBuffer) {
//   try {
//     const data = await PDFParser(pdfBuffer);
//     return data.text;
//   } catch (error) {
//     throw new Error('Error parsing PDF:', error);
//   }
// }

// async function getEmbeddingsFromText(text) {
//   try {
//     const response = await axios.post(textEmbeddingURL, {
//       prompt: text,
//       max_tokens: 50,
//     }, {
//       headers: {
//         'Authorization': `Bearer ${apiKey}`,
//         'Content-Type': 'application/json',
//       },
//     });
//     return response.data.choices[0].text.trim();
//   } catch (error) {
//     throw new Error('Error generating embeddings:', error);
//   }
// }

// async function askGPTQuestion(question) {
//   try {
//     const response = await axios.post(gptURL, {
//       prompt: `Question: ${question}\nAnswer:`,
//       max_tokens: 100,
//     }, {
//       headers: {
//         'Authorization': `Bearer ${apiKey}`,
//         'Content-Type': 'application/json',
//       },
//     });
//     return response;
//   } catch (error) {
//     throw new Error('Error asking question:', error);
//   }
// }

// function storeEmbeddingsInExcel(embeddings) {
//   if (!worksheet) {
//     throw new Error('Excel worksheet not initialized.');
//   }

//   worksheet.addRow({ embeddings });

//   workbook.xlsx.writeFile('embeddings.xlsx')
//     .catch((error) => {
//       throw new Error('Error writing embeddings to Excel:', error);
//     });
// }

// app.listen(port, () => {
//   console.log(`Backend server running at http://localhost:${port}`);
// });

/************************************************************************************************************************* */

// const express = require('express');
// const PDFParser = require('pdf-parse');
// const cors = require('cors');
// const { TextEmbedding, GPT } = require('@openai/models');
// const ExcelJS = require('exceljs');

// const app = express();
// app.use(cors());
// const port = 4000;

// const embeddingModel = new TextEmbedding({ model: 'text-embedding-ada-002' });
// const gptModel = new GPT({ engine: 'gpt-3.5-turbo', apiKey: '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' });
// let workbook;
// let worksheet;

// app.use(express.json());

// app.post('/upload', async (req, res) => {
//   try {
//     if (!req.body || !req.body.pdfBuffer) {
//       throw new Error('PDF buffer not provided.');
//     }

//     const pdfBuffer = req.body.pdfBuffer;

//     // Extract text from PDF
//     const pdfText = await extractTextFromPDF(pdfBuffer);

//     if (!pdfText) {
//       throw new Error('Failed to extract text from the PDF.');
//     }

//     // Get embeddings from text
//     const embeddings = await getEmbeddingsFromText(pdfText);

//     // Create a new Excel workbook and store embeddings in a worksheet
//     workbook = new ExcelJS.Workbook();
//     worksheet = workbook.addWorksheet('PDFEmbeddings');
//     storeEmbeddingsInExcel(embeddings);

//     res.status(200).send('PDF processed and embeddings stored successfully.');
//   } catch (error) {
//     res.status(500).send(`Error processing PDF: ${error.message}`);
//   }
// });

// app.post('/ask', async (req, res) => {
//   try {
//     if (!req.body || !req.body.question) {
//       throw new Error('Question not provided.');
//     }

//     const question = req.body.question;

//     // Get embeddings for the question
//     const questionEmbeddings = await getEmbeddingsFromText(question);

//     // Retrieve embeddings from Excel and compare with question embeddings to find relevant data

//     // Use GPT-3.5 Turbo to respond to the question
//     const response = await gptModel.complete({
//       prompt: `Question: ${question}\nAnswer:`,
//       max_tokens: 100,
//     });

//     res.status(200).json({ answer: response.choices[0].text.trim() });
//   } catch (error) {
//     res.status(500).send(`Error processing question: ${error.message}`);
//   }
// });

// // Helper functions
// async function extractTextFromPDF(pdfBuffer) {
//   try {
//     const data = await PDFParser(pdfBuffer);
//     return data.text;
//   } catch (error) {
//     throw new Error('Error parsing PDF:', error);
//   }
// }

// async function getEmbeddingsFromText(text) {
//   try {
//     const embeddings = await embeddingModel.embed({ texts: [text] });
//     return embeddings;
//   } catch (error) {
//     throw new Error('Error generating embeddings:', error);
//   }
// }

// function storeEmbeddingsInExcel(embeddings) {
//   if (!worksheet) {
//     throw new Error('Excel worksheet not initialized.');
//   }

//   embeddings.forEach((embedding) => {
//     worksheet.addRow({ embedding });
//   });

//   workbook.xlsx.writeFile('embeddings.xlsx')
//     .catch((error) => {
//       throw new Error('Error writing embeddings to Excel:', error);
//     });
// }

// app.listen(port, () => {
//   console.log(`Backend server running at http://localhost:${port}`);
// });
// require('dotenv').config();
// const express = require('express');
// const OpenAI = require('openai');
// const ExcelJS = require('exceljs'); // Import the ExcelJS library
// const cors = require('cors');

// const app = express();

// app.use(express.json());
// app.use(cors()); // Enable CORS for all routes

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // Function to generate embeddings using text-embedding-ada-002
// const generateEmbeddings = async (text) => {
//   const embeddingsResponse = await openai.embeddings.create({
//     model: 'text-embedding-ada-002',
//     documents: [text],
//   });
//   return embeddingsResponse.data;
// };

// // Function to perform chat completions using gpt-3.5-turbo
// const performChatCompletion = async (prompt) => {
//   const chatCompletionResponse = await openai.complete({
//     engine: 'gpt-3.5-turbo',
//     prompt,
//   });
//   return chatCompletionResponse.data.choices[0].text.trim();
// };

// // Function to store embeddings in an Excel file
// const storeEmbeddingsInExcel = async (embeddings) => {
//   const workbook = new ExcelJS.Workbook();
//   const worksheet = workbook.addWorksheet('Embeddings');

//   embeddings.forEach((embedding, index) => {
//     worksheet.addRow({
//       Index: index + 1,
//       Embedding: embedding, // Assuming 'embedding' is the actual embedding data
//       // Add other relevant columns if needed
//     });
//   });

//   await workbook.xlsx.writeFile('embeddings.xlsx');
// };

// // API endpoint to handle user queries
// app.post('/api/chat', async (req, res) => {
//   const { userQuery } = req.body;

//   try {
//     // Generate embeddings using text-embedding-ada-002
//     const embeddings = await generateEmbeddings(userQuery);

//     // Perform chat completion using gpt-3.5-turbo
//     const chatResponse = await performChatCompletion(userQuery);

//     // Store embeddings in Excel file
//     await storeEmbeddingsInExcel(embeddings); // Assuming embeddings contain the required data

//     // Sending a response back with chat completion result
//     res.json({ chatResponse });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.listen(4000, () => {
//   console.log('Server running on port 4000');
// });


/***************************************************************************************** */

// require('dotenv').config();
// const express = require('express');
// const OpenAI = require('openai');
// const PDFParser = require('pdf-parse');
// const fs = require('fs');
// const cors = require('cors');

// const app = express();

// app.use(express.json());
// app.use(cors()); // Enable CORS for all routes

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // Function to extract text from the PDF
// const extractTextFromPDF = () => {
//   return new Promise((resolve, reject) => {
//     const pdfBuffer = fs.readFileSync('./sample1.pdf');
//     PDFParser(pdfBuffer).then(data => {
//       const pdfText = data.text;
//       resolve(pdfText);
//     }).catch(error => {
//       reject(error);
//     });
//   });
// };

// app.post('/api/chat', async (req, res) => {
//   const { userQuery } = req.body;

//   try {
//     const pdfText = await extractTextFromPDF();

//     // Generate embeddings for the PDF text and user query
//     const pdfEmbeddings = await openai.embeddings.create({
//       model: 'text-embedding-ada-002',
//       documents: [pdfText],
//     });

//     const userQueryEmbeddings = await openai.embeddings.create({
//       model: 'text-embedding-ada-002',
//       documents: [userQuery],
//     });

//     // Generate completion using gpt-3.5-turbo for the user query
//     const completion = await openai.completions.create({
//       model: 'gpt-3.5-turbo',
//       prompt: userQuery,
//     });

//     const botResponse = completion.data.choices[0].text.trim();

//     // Send the response to the frontend
//     res.json({ response: botResponse });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// app.listen(4000, () => {
//   console.log('Server running on port 4000');
// });
