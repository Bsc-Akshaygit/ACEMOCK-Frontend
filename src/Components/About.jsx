import "../ComponentStyles/About.css"

export function About(){
    return(
        <>
        <div className="container">
            <div className="first-box">
                <img src="modern-3d-illustration-young-man-programming.avif" alt="develop-image" />
            </div>
            <div className="second-box">
                <h3> <span style={{color:'rgb(217, 34, 113)'}}>ACEMOCK,</span> <br /> AI Interview Plarform,</h3>
                <p>This AI Interview preparation platform designed for a practice purpose only. here you are hitting the gemini api for generating the response. here if you can find any mislead then just forget about it. it's just a practice project for learning only. where you can chat or prepare for interview with an agent which specifically generate response from Interviwer perspective. Thank you.</p>
            </div>
        </div>
        <p className="copy-right"> &copy; All rights are reserved.</p>
        </>
    );
}