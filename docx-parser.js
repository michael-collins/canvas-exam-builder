/**
 * DOCX Parser for Quiz Questions
 * Extracts quiz questions from Word documents and converts to JSON format
 */

class DocxParser {
    constructor() {
        this.questions = [];
    }

    /**
     * Parse a DOCX file and extract quiz questions
     * Expected format in Word doc:
     * 1. Question text?
     * a) Option 1
     * b) Option 2
     * c) Option 3
     * d) Option 4
     * Answer: a
     * 
     * @param {File} file - The DOCX file
     * @returns {Promise<Array>} Array of question objects
     */
    async parseDocx(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            const text = result.value;
            
            this.questions = this.parseQuestions(text);
            return this.questions;
        } catch (error) {
            console.error('Error parsing DOCX:', error);
            throw new Error('Failed to parse DOCX file: ' + error.message);
        }
    }

    /**
     * Parse text content into structured questions
     * @param {string} text - Raw text from document
     * @returns {Array} Array of question objects
     */
    parseQuestions(text) {
        const questions = [];
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        let currentQuestion = null;
        let questionNumber = 1;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if line is a question (starts with number or contains ?)
            if (this.isQuestionLine(line)) {
                // Save previous question if exists
                if (currentQuestion && currentQuestion.question) {
                    questions.push(currentQuestion);
                }
                
                // Start new question
                currentQuestion = {
                    id: `q${questionNumber++}`,
                    question: this.cleanQuestionText(line),
                    type: 'multiple_choice',
                    choices: [],
                    correctAnswer: null,
                    points: 1
                };
            }
            // Check if line is an answer choice (a), b), c), etc.)
            else if (this.isChoiceLine(line) && currentQuestion) {
                const choice = this.parseChoice(line);
                if (choice) {
                    currentQuestion.choices.push(choice);
                }
            }
            // Check if line specifies the correct answer
            else if (this.isAnswerLine(line) && currentQuestion) {
                const answer = this.parseAnswer(line);
                if (answer) {
                    currentQuestion.correctAnswer = answer;
                }
            }
            // Check if line specifies points
            else if (this.isPointsLine(line) && currentQuestion) {
                const points = this.parsePoints(line);
                if (points) {
                    currentQuestion.points = points;
                }
            }
        }
        
        // Add the last question
        if (currentQuestion && currentQuestion.question) {
            questions.push(currentQuestion);
        }
        
        return questions;
    }

    isQuestionLine(line) {
        // Match lines like "1.", "1)", "Question 1:", or just containing "?"
        return /^\d+[\.\):]/.test(line) || 
               /^Question\s+\d+/i.test(line) ||
               (line.includes('?') && !line.match(/^[a-z]\)/i));
    }

    isChoiceLine(line) {
        // Match lines like "a)", "A.", "a.", "(a)", etc.
        return /^[\(]?[a-z][\.\)]/i.test(line);
    }

    isAnswerLine(line) {
        // Match lines like "Answer: a", "Correct: b", "Answer is a"
        return /^(answer|correct|ans)[\s:]+[a-z]/i.test(line);
    }

    isPointsLine(line) {
        // Match lines like "Points: 5", "5 points"
        return /^points?[\s:]+\d+/i.test(line) || /^\d+\s+points?/i.test(line);
    }

    cleanQuestionText(line) {
        // Remove question numbers and clean up
        return line.replace(/^\d+[\.\):\s]+/, '')
                   .replace(/^Question\s+\d+[\:\s]+/i, '')
                   .trim();
    }

    parseChoice(line) {
        // Extract choice letter and text
        const match = line.match(/^[\(]?([a-z])[\.\)]\)?\s*(.+)/i);
        if (match) {
            return {
                id: match[1].toLowerCase(),
                text: match[2].trim()
            };
        }
        return null;
    }

    parseAnswer(line) {
        // Extract answer letter
        const match = line.match(/^(?:answer|correct|ans)[\s:]+([a-z])/i);
        if (match) {
            return match[1].toLowerCase();
        }
        return null;
    }

    parsePoints(line) {
        // Extract points value
        const match = line.match(/(\d+)/);
        if (match) {
            return parseInt(match[1], 10);
        }
        return null;
    }

    /**
     * Get questions in JSON format
     * @returns {Object} Quiz data in JSON format
     */
    toJSON() {
        return {
            title: 'Imported Quiz',
            description: 'Quiz imported from Word document',
            questions: this.questions,
            metadata: {
                totalQuestions: this.questions.length,
                totalPoints: this.questions.reduce((sum, q) => sum + q.points, 0),
                createdAt: new Date().toISOString()
            }
        };
    }
}
