import { useState } from 'react'; 
import './App.css'; 
function App() { 
  const [resumeFile, setResumeFile] = useState(null); 
  const [jobDescription, setJobDescription] = useState(''); 
  const [loading, setLoading] = useState(false); 
  const [result, setResult] = useState(null); 
  
  const handleFileChange = (e) => { 
    setResumeFile(e.target.files[0]); 
  }; 
  
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    if (!resumeFile || !jobDescription.trim()) { 
      alert('Please upload a resume and paste a job description.'); 
      return; 
    } 
    setLoading(true); 
    setResult(null); 
    
    try { 
      const formData = new FormData(); 
      formData.append('resume', resumeFile); 
      formData.append('jobDescription', jobDescription); 
      const response = await fetch( 
        'https://ai-resume-analyzer-api-2vqz.onrender.com', 
        { 
          method: 'POST', 
          body: formData, 
        } 
      ); 
      
      const data = await response.json(); 
      
      if (!response.ok) { 
        alert(data.error || 'Something went wrong while analyzing the resume.'); 
        return; 
      } 
      
      if (data.error) { 
        alert(data.error); 
      } else { 
        setResult(data); 
      } 
    } catch (err) { 
      console.error('API Error:', err); 
      alert('Unable to connect to the server. Please try again.'); 
    } finally { 
      setLoading(false); 
    } 
  }; 
  
    return (
    <div className="app">
      <div className="header"> 
        <h1>AI Resume Analyzer</h1>
        <p className="subtitle"> 
          Get instant AI-powered feedback on your resume 
        </p> 
      </div> 
      
      <form onSubmit={handleSubmit} className="card"> 
        <div className="field"> 
          <label htmlFor="resume">Resume (PDF)</label> 
          <div className="file-upload"> 
            <input 
              id="resume" 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange} 
            /> 
            
            <span className="file-upload-label"> 
              {resumeFile 
                ? resumeFile.name 
                : 'Choose a file or drag it here'} 
            </span> 
          </div> 
        </div> 
        
        <div className="field"> 
          <label htmlFor="jd">Job Description</label> 
          
          <textarea 
            id="jd" 
            rows={8} 
            value={jobDescription} 
            onChange={(e) => setJobDescription(e.target.value)} 
            placeholder="Paste the full job description here..." 
          /> 
        </div> 
        
        <button type="submit" disabled={loading}> 
          {loading ? <span className="spinner"></span> : 'Analyze Resume'} 
        </button> 
      </form> 
      {result && ( 
        <div className="card results"> 
          <div className="score-section"> 
            <div 
              className="score-circle" 
              style={{ '--score': `${result.match_score}%` }} 
            > 
              <span className="score-number"> 
                {result.match_score} 
              </span> 
              
              <span className="score-label">/ 100</span> 
            </div> 
            
            <p className="score-caption">Match Score</p> 
          </div> 
          
          <h3>Missing Keywords</h3> 
          
          <div className="tags"> 
            {result.missing_keywords.map((keyword, i) => ( 
              <span key={i} className="tag"> 
                {keyword} 
              </span> 
            ))} 
          </div> 
          
          <h3>Suggestions</h3> 
          
          <ul className="suggestions-list"> 
            {result.suggestions.map((suggestion, i) => ( 
              <li key={i}> 
                <span className="bullet">✓</span> 
                {suggestion} 
              </li> 
            ))} 
          </ul> 
        </div> 
      )} 
    </div> 
  ); 
} 

export default App;