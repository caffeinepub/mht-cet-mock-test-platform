import type { TestAttempt, FullSyllabusTest, ChapterWiseTestDetails, UserProfile, Question } from '../backend';

interface PDFGenerationParams {
  attempt: TestAttempt;
  test: FullSyllabusTest | ChapterWiseTestDetails;
  profile: UserProfile;
  questions: Question[];
  isChapterWise: boolean;
}

export function generateResultPDF(params: PDFGenerationParams): { success: boolean; error?: string } {
  try {
    const { attempt, test, profile, questions, isChapterWise } = params;
    
    // Calculate scores
    const totalScore = Number(attempt.totalScore);
    let maxTotalScore: number;
    
    if (isChapterWise) {
      const chapterTest = test as ChapterWiseTestDetails;
      maxTotalScore = questions.length * Number(chapterTest.marksPerQuestion);
    } else {
      const fullTest = test as FullSyllabusTest;
      maxTotalScore = fullTest.section1.questionIds.length * Number(fullTest.section1.marksPerQuestion) +
                      fullTest.section2.questionIds.length * Number(fullTest.section2.marksPerQuestion);
    }
    
    const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore) * 100 : 0;
    
    // Format date
    const attemptDate = new Date(Number(attempt.createdAt) / 1000000);
    const formattedDate = attemptDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Format time
    const totalTimeSeconds = Number(attempt.totalTimeTaken) / 1000000000;
    const hours = Math.floor(totalTimeSeconds / 3600);
    const minutes = Math.floor((totalTimeSeconds % 3600) / 60);
    const seconds = Math.floor(totalTimeSeconds % 60);
    const timeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Performance indicator
    let performanceText = 'Needs Improvement';
    if (percentage >= 80) {
      performanceText = 'Excellent';
    } else if (percentage >= 60) {
      performanceText = 'Good';
    }
    
    // Calculate statistics
    const totalQuestions = questions.length;
    let attempted = 0;
    let correct = 0;

    const allAnswers = isChapterWise 
      ? attempt.singleSectionAnswers 
      : [...attempt.section1Answers, ...attempt.section2Answers];

    allAnswers.forEach(answer => {
      if (Number(answer.selectedOptionIndex) >= 0) {
        attempted++;
      }
      const question = questions.find(q => q.id === answer.questionId);
      if (question && question.correctAnswerIndex === answer.selectedOptionIndex) {
        correct++;
      }
    });

    const incorrect = attempted - correct;
    const unanswered = totalQuestions - attempted;
    const accuracy = attempted > 0 ? (correct / attempted) * 100 : 0;
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test Result - ${test.testName}</title>
        <style>
          @media print {
            @page {
              margin: 1cm;
              size: A4;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .page-break {
              page-break-before: always;
            }
            .no-break {
              page-break-inside: avoid;
            }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #003366;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #003366;
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .header h2 {
            color: #666;
            margin: 0;
            font-size: 18px;
            font-weight: normal;
          }
          .test-info {
            margin-bottom: 20px;
          }
          .test-info p {
            margin: 5px 0;
          }
          .score-box {
            background: #003366;
            color: white;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            border-radius: 8px;
          }
          .score-box h2 {
            margin: 0;
            font-size: 32px;
          }
          .section {
            margin: 20px 0;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 5px;
          }
          .section h3 {
            margin-top: 0;
            color: #003366;
            border-bottom: 2px solid #003366;
            padding-bottom: 10px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 10px 0;
          }
          .stat-item {
            padding: 10px;
            background: white;
            border-radius: 5px;
          }
          .stat-label {
            font-weight: bold;
            color: #666;
          }
          .question {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: white;
          }
          .question-header {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .option {
            padding: 8px;
            margin: 5px 0;
            border-radius: 4px;
          }
          .correct {
            background: #d4edda;
            border: 2px solid #28a745;
          }
          .incorrect {
            background: #f8d7da;
            border: 2px solid #dc3545;
          }
          .explanation {
            margin-top: 10px;
            padding: 10px;
            background: #e7f3ff;
            border-left: 4px solid #0066cc;
            border-radius: 4px;
          }
          .explanation-label {
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 5px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #003366;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 5px;
          }
          .badge-success {
            background: #28a745;
            color: white;
          }
          .badge-danger {
            background: #dc3545;
            color: white;
          }
          .badge-warning {
            background: #ffc107;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Concept Δelta</h1>
          <h2>MHT-CET Mock Test Result</h2>
        </div>
        
        <div class="test-info">
          <p><strong>Test Name:</strong> ${test.testName}</p>
          <p><strong>Student:</strong> ${profile.name}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
        </div>
        
        <div class="score-box">
          <h2>Overall Score: ${totalScore} / ${maxTotalScore}</h2>
          <p style="margin: 10px 0 0 0; font-size: 18px;">${percentage.toFixed(2)}%</p>
        </div>
        
        <div class="section no-break">
          <h3>Score Summary</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Total Score</div>
              <div>${totalScore} / ${maxTotalScore} marks</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Percentage</div>
              <div>${percentage.toFixed(2)}%</div>
            </div>
            ${!isChapterWise ? `
            <div class="stat-item">
              <div class="stat-label">Section 1</div>
              <div>${Number(attempt.section1Score)} marks</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Section 2</div>
              <div>${Number(attempt.section2Score)} marks</div>
            </div>
            ` : ''}
            <div class="stat-item">
              <div class="stat-label">Time Taken</div>
              <div>${timeFormatted}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Performance</div>
              <div>${performanceText}</div>
            </div>
          </div>
        </div>
        
        <div class="section no-break">
          <h3>Statistics Summary</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Total Questions</div>
              <div>${totalQuestions}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Questions Attempted</div>
              <div>${attempted}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Correct Answers</div>
              <div>${correct}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Incorrect Answers</div>
              <div>${incorrect}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Unanswered Questions</div>
              <div>${unanswered}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Accuracy</div>
              <div>${accuracy.toFixed(2)}%</div>
            </div>
          </div>
        </div>
        
        <div class="page-break"></div>
        
        <div class="section">
          <h3>Question-by-Question Breakdown</h3>
          ${questions.map((question, index) => {
            const userAnswer = allAnswers.find(a => a.questionId === question.id);
            const selectedIndex = userAnswer ? Number(userAnswer.selectedOptionIndex) : -1;
            const correctIndex = Number(question.correctAnswerIndex);
            const isCorrect = selectedIndex === correctIndex;
            
            let marksPerQuestion: number;
            if (isChapterWise) {
              marksPerQuestion = Number((test as ChapterWiseTestDetails).marksPerQuestion);
            } else {
              const fullTest = test as FullSyllabusTest;
              const isSection1 = fullTest.section1.questionIds.some(id => id === question.id);
              marksPerQuestion = isSection1 
                ? Number(fullTest.section1.marksPerQuestion) 
                : Number(fullTest.section2.marksPerQuestion);
            }
            const marksAwarded = isCorrect ? marksPerQuestion : 0;
            
            const questionText = question.questionText || 'Question';
            const truncatedText = questionText.length > 100 ? questionText.substring(0, 100) + '...' : questionText;
            
            return `
              <div class="question no-break">
                <div class="question-header">
                  Q${index + 1}. ${truncatedText}
                  ${selectedIndex >= 0 ? (isCorrect ? '<span class="badge badge-success">✓ Correct</span>' : '<span class="badge badge-danger">✗ Incorrect</span>') : '<span class="badge badge-warning">Not Answered</span>'}
                </div>
                <div style="margin: 10px 0;">
                  <strong>Your Answer:</strong> ${selectedIndex >= 0 && selectedIndex < question.options.length ? (question.options[selectedIndex].optionText || `Option ${String.fromCharCode(65 + selectedIndex)}`) : 'Not answered'}
                </div>
                <div style="margin: 10px 0;">
                  <strong>Correct Answer:</strong> ${correctIndex >= 0 && correctIndex < question.options.length ? (question.options[correctIndex].optionText || `Option ${String.fromCharCode(65 + correctIndex)}`) : 'N/A'}
                </div>
                <div style="margin: 10px 0;">
                  <strong>Marks:</strong> ${marksAwarded} / ${marksPerQuestion}
                </div>
                ${question.explanation ? `
                <div class="explanation">
                  <div class="explanation-label">Explanation:</div>
                  <div>${question.explanation}</div>
                </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="footer">
          <p><strong>Concept Δelta</strong> | @coep_conceptdelta2031</p>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </body>
      </html>
    `;
    
    // Open print dialog with the HTML content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow pop-ups for this site.');
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
    
    return { success: true };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
