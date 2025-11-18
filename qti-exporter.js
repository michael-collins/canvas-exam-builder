/**
 * QTI Exporter
 * Converts JSON quiz data to QTI 1.2 format compatible with Canvas LMS
 */

class QtiExporter {
    constructor(quizData) {
        this.quizData = quizData;
        this.assessmentId = 'assessment_' + Date.now();
        this.version = '1.2'; // Default to QTI 1.2
    }

    /**
     * Set QTI version
     * @param {string} version - '1.2' or '2.1'
     */
    setVersion(version) {
        this.version = version;
    }

    /**
     * Generate QTI XML from quiz data
     * @returns {string} QTI XML content
     */
    generateQTI() {
        const { title, description, questions } = this.quizData;
        
        // Validate questions before generating QTI
        this.validateQuestions(questions);
        
        if (this.version === '2.1') {
            return this.generateQTI21();
        } else {
            return this.generateQTI12();
        }
    }

    /**
     * Generate QTI 1.2 XML
     */
    generateQTI12() {
        const { title, description, questions } = this.quizData;
        
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd">
  <assessment ident="${this.assessmentId}" title="${this.escapeXml(title)}">
    <qtimetadata>
      <qtimetadatafield>
        <fieldlabel>cc_maxattempts</fieldlabel>
        <fieldentry>1</fieldentry>
      </qtimetadatafield>
      <qtimetadatafield>
        <fieldlabel>qmd_timelimit</fieldlabel>
        <fieldentry>0</fieldentry>
      </qtimetadatafield>
    </qtimetadata>
    <section ident="root_section">
${questions.map((q, idx) => this.generateQuestion(q, idx)).join('\n')}
    </section>
  </assessment>
</questestinterop>`;
        
        return xml;
    }

    /**
     * Generate QTI 2.1 XML
     */
    generateQTI21() {
        const { title, questions } = this.quizData;
        
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd">
  <assessmentTest identifier="${this.assessmentId}" title="${this.escapeXml(title)}">
    <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
      <defaultValue>
        <value>0</value>
      </defaultValue>
    </outcomeDeclaration>
    <testPart identifier="testPart1" navigationMode="nonlinear" submissionMode="individual">
      <assessmentSection identifier="section1" title="Quiz" visible="true">
${questions.map((q, idx) => this.generateQuestion21(q, idx)).join('\n')}
      </assessmentSection>
    </testPart>
  </assessmentTest>
</questestinterop>`;
        
        return xml;
    }

    /**
     * Generate QTI 2.1 question item reference
     */
    generateQuestion21(question, index) {
        const questionId = question.id || `question_${index + 1}`;
        
        return `        <assessmentItemRef identifier="${questionId}" href="${questionId}.xml">
          <weight identifier="SCORE" value="${question.points || 1}"/>
        </assessmentItemRef>`;
    }

    /**
     * Generate QTI 2.1 item file
     */
    generateItem21(question, index) {
        const questionId = question.id || `question_${index + 1}`;
        const correctAnswer = question.correctAnswer || '';
        
        const choicesXml = question.choices.map(choice => 
            `          <simpleChoice identifier="${choice.id}">${this.escapeXml(choice.text)}</simpleChoice>`
        ).join('\n');
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd" identifier="${questionId}" title="Question ${index + 1}" adaptive="false" timeDependent="false">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
    <correctResponse>
      <value>${correctAnswer}</value>
    </correctResponse>
  </responseDeclaration>
  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue>
      <value>0</value>
    </defaultValue>
  </outcomeDeclaration>
  <itemBody>
    <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">
      <prompt>${this.escapeXml(question.question)}</prompt>
${choicesXml}
    </choiceInteraction>
  </itemBody>
  <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct"/>
</assessmentItem>`;
    }

    /**
     * Validate questions have required fields
     */
    validateQuestions(questions) {
        const errors = [];
        questions.forEach((q, i) => {
            if (!q.question || q.question.trim() === '') {
                errors.push(`Question ${i + 1}: Missing question text`);
            }
            if (!q.choices || q.choices.length === 0) {
                errors.push(`Question ${i + 1}: No answer choices`);
            }
            if (!q.correctAnswer) {
                errors.push(`Question ${i + 1}: Missing correct answer`);
            }
            // Validate correct answer exists in choices
            if (q.correctAnswer && q.choices) {
                const choiceIds = q.choices.map(c => c.id);
                if (!choiceIds.includes(q.correctAnswer)) {
                    errors.push(`Question ${i + 1}: Correct answer '${q.correctAnswer}' not found in choices [${choiceIds.join(', ')}]`);
                }
            }
        });
        
        if (errors.length > 0) {
            throw new Error('QTI Validation Failed:\n' + errors.join('\n'));
        }
    }

    /**
     * Generate QTI XML for a single question
     * @param {Object} question - Question data
     * @param {number} index - Question index
     * @returns {string} Question XML
     */
    generateQuestion(question, index) {
        const questionId = question.id || `question_${index + 1}`;
        
        switch (question.type) {
            case 'multiple_choice':
                return this.generateMultipleChoice(question, questionId);
            case 'true_false':
                return this.generateTrueFalse(question, questionId);
            case 'essay':
                return this.generateEssay(question, questionId);
            default:
                return this.generateMultipleChoice(question, questionId);
        }
    }

    /**
     * Generate multiple choice question in QTI format
     */
    generateMultipleChoice(question, questionId) {
        const correctAnswer = question.correctAnswer || '';
        
        if (!correctAnswer) {
            console.error(`Question ${questionId} missing correct answer`);
        }
        
        return `      <item ident="${questionId}" title="Question ${questionId}">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield>
              <fieldlabel>question_type</fieldlabel>
              <fieldentry>multiple_choice_question</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>points_possible</fieldlabel>
              <fieldentry>${question.points || 1}</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>assessment_question_identifierref</fieldlabel>
              <fieldentry>${questionId}_ref</fieldentry>
            </qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/html">${this.escapeXml(question.question)}</mattext>
          </material>
          <response_lid ident="response1" rcardinality="Single">
            <render_choice>
${question.choices.map(choice => `              <response_label ident="${choice.id}">
                <material>
                  <mattext texttype="text/plain">${this.escapeXml(choice.text)}</mattext>
                </material>
              </response_label>`).join('\n')}
            </render_choice>
          </response_lid>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
          </outcomes>
          <respcondition continue="No">
            <conditionvar>
              <varequal respident="response1">${correctAnswer}</varequal>
            </conditionvar>
            <setvar action="Set" varname="SCORE">100</setvar>
          </respcondition>
        </resprocessing>
      </item>`;
    }

    /**
     * Generate true/false question in QTI format
     */
    generateTrueFalse(question, questionId) {
        const correctAnswer = question.correctAnswer === 'true' || question.correctAnswer === 'a' ? 'true' : 'false';
        
        return `      <item ident="${questionId}" title="Question ${questionId}">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield>
              <fieldlabel>question_type</fieldlabel>
              <fieldentry>true_false_question</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>points_possible</fieldlabel>
              <fieldentry>${question.points || 1}</fieldentry>
            </qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/html">${this.escapeXml(question.question)}</mattext>
          </material>
          <response_lid ident="response1" rcardinality="Single">
            <render_choice>
              <response_label ident="true">
                <material>
                  <mattext>True</mattext>
                </material>
              </response_label>
              <response_label ident="false">
                <material>
                  <mattext>False</mattext>
                </material>
              </response_label>
            </render_choice>
          </response_lid>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
          </outcomes>
          <respcondition continue="No">
            <conditionvar>
              <varequal respident="response1">${correctAnswer}</varequal>
            </conditionvar>
            <setvar action="Set" varname="SCORE">100</setvar>
          </respcondition>
        </resprocessing>
      </item>`;
    }

    /**
     * Generate essay question in QTI format
     */
    generateEssay(question, questionId) {
        return `      <item ident="${questionId}" title="Question ${questionId}">
        <itemmetadata>
          <qtimetadata>
            <qtimetadatafield>
              <fieldlabel>question_type</fieldlabel>
              <fieldentry>essay_question</fieldentry>
            </qtimetadatafield>
            <qtimetadatafield>
              <fieldlabel>points_possible</fieldlabel>
              <fieldentry>${question.points || 1}</fieldentry>
            </qtimetadatafield>
          </qtimetadata>
        </itemmetadata>
        <presentation>
          <material>
            <mattext texttype="text/html">${this.escapeXml(question.question)}</mattext>
          </material>
          <response_str ident="response1" rcardinality="Single">
            <render_fib>
              <response_label ident="answer1" rshuffle="No"/>
            </render_fib>
          </response_str>
        </presentation>
        <resprocessing>
          <outcomes>
            <decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/>
          </outcomes>
        </resprocessing>
      </item>`;
    }

    /**
     * Escape XML special characters
     */
    escapeXml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Create a downloadable QTI file
     * @param {string} filename - Name for the output file
     * @returns {Promise<Blob>} QTI file as a blob
     */
    async createQtiPackage(filename = 'quiz') {
        const qtiXml = this.generateQTI();
        
        // Create imsmanifest.xml
        const manifest = this.generateManifest();
        
        // Create a zip file containing the QTI files
        const zip = new JSZip();
        
        if (this.version === '2.1') {
            // QTI 2.1 requires separate item files
            zip.file(`${this.assessmentId}.xml`, qtiXml);
            this.quizData.questions.forEach((q, idx) => {
                const itemId = q.id || `question_${idx + 1}`;
                const itemXml = this.generateItem21(q, idx);
                zip.file(`${itemId}.xml`, itemXml);
            });
        } else {
            // QTI 1.2 has everything in one file
            zip.file(`${this.assessmentId}.xml`, qtiXml);
        }
        
        zip.file('imsmanifest.xml', manifest);
        
        const blob = await zip.generateAsync({ type: 'blob' });
        return blob;
    }

    /**
     * Generate IMS manifest file
     */
    generateManifest() {
        const { title } = this.quizData;
        const resourceType = this.version === '2.1' ? 'imsqti_xmlv2p1' : 'imsqti_xmlv1p2';
        
        let resourceFiles = `      <file href="${this.assessmentId}.xml"/>`;
        
        if (this.version === '2.1') {
            // Add individual item files for QTI 2.1
            this.quizData.questions.forEach((q, idx) => {
                const itemId = q.id || `question_${idx + 1}`;
                resourceFiles += `\n      <file href="${itemId}.xml"/>`;
            });
        }
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="manifest_${Date.now()}" xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" xmlns:lom="http://ltsc.ieee.org/xsd/imsmd_v1p2" xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_v1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 http://www.imsglobal.org/xsd/imscp_v1p2.xsd http://ltsc.ieee.org/xsd/imsmd_v1p2 http://www.imsglobal.org/xsd/imsmd_v1p2p2.xsd http://www.imsglobal.org/xsd/imsmd_v1p2 http://www.imsglobal.org/xsd/imsmd_v1p2p2.xsd">
  <metadata>
    <schema>IMS Content</schema>
    <schemaversion>1.1.3</schemaversion>
    <imsmd:lom>
      <imsmd:general>
        <imsmd:title>
          <imsmd:langstring xml:lang="en">${this.escapeXml(title)}</imsmd:langstring>
        </imsmd:title>
      </imsmd:general>
    </imsmd:lom>
  </metadata>
  <organizations/>
  <resources>
    <resource identifier="resource_${this.assessmentId}" type="${resourceType}">
${resourceFiles}
    </resource>
  </resources>
</manifest>`;
    }

    /**
     * Download the QTI package
     */
    async download(filename = 'quiz') {
        const blob = await this.createQtiPackage(filename);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
