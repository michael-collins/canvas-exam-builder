# Canvas Exam Builder

Convert Word documents (.docx) to Canvas-compatible QTI format — completely client-side!

## Features

- 🎯 **Drag & Drop Interface** - Simply drag your .docx file into the browser
- 📝 **Automatic Question Parsing** - Extracts multiple choice questions from Word documents
- 🔄 **JSON Intermediate Format** - View and copy the extracted JSON data
- 📦 **QTI Export** - Download Canvas-compatible QTI packages (.zip)
- 🔒 **Client-Side Processing** - All processing happens in your browser, no server required

## Getting Started

1. Open `index.html` in a web browser
2. Drag and drop your .docx file or click to browse
3. Review the extracted questions (optional: view JSON)
4. Download the QTI package
5. Import the .zip file into Canvas

## Word Document Format

Your Word document should follow this format for best results:

```
1. What is the capital of France?
a) London
b) Paris
c) Berlin
d) Madrid
Answer: b

2. Which planet is known as the Red Planet?
a) Venus
b) Mars
c) Jupiter
d) Saturn
Answer: b
Points: 2
```

### Format Guidelines

- Questions should start with a number followed by `.`, `)`, or `:`
- Answer choices should use letters (a, b, c, d) followed by `)` or `.`
- Specify the correct answer with "Answer: [letter]"
- Optionally specify points with "Points: [number]" (defaults to 1)

## Supported Question Types

- **Multiple Choice** - Standard multiple choice with 2-10 options
- **True/False** - Two option questions
- **Essay** - Open-ended questions (manual grading required)

## Technical Details

### Technologies Used

- **Mammoth.js** - DOCX to text conversion
- **JSZip** - QTI package creation
- Pure JavaScript (no framework required)
- HTML5 & CSS3

### JSON Schema

The intermediate JSON format:

```json
{
  "title": "Imported Quiz",
  "description": "Quiz imported from Word document",
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "type": "multiple_choice",
      "choices": [
        { "id": "a", "text": "Option A" },
        { "id": "b", "text": "Option B" }
      ],
      "correctAnswer": "a",
      "points": 1
    }
  ],
  "metadata": {
    "totalQuestions": 1,
    "totalPoints": 1,
    "createdAt": "2025-11-17T..."
  }
}
```

### QTI Format

Generates QTI 1.2 format compatible with:
- Canvas LMS
- Moodle
- Blackboard
- Other QTI-compliant systems

## Files

- `index.html` - Main application interface
- `app.js` - Application logic and event handlers
- `docx-parser.js` - Word document parser
- `qti-exporter.js` - QTI XML generator
- `styles.css` - Application styling

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Troubleshooting

**No questions found?**
- Check your document format matches the guidelines above
- Ensure questions are numbered
- Verify answer choices use letters (a, b, c, d)

**QTI file not importing to Canvas?**
- Make sure you're uploading the .zip file, not the extracted XML
- Verify all questions have correct answers specified

## Future Enhancements

Potential features to add:
- Support for matching questions
- Support for fill-in-the-blank
- Question pools/groups
- Image support
- Quiz settings configuration
- Bulk editing interface

## License

MIT License - Feel free to use and modify for your needs.

## Contributing

Contributions welcome! Please test thoroughly with various document formats.
