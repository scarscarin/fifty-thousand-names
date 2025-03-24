document.addEventListener("DOMContentLoaded", () => {
    const introText = "As of March 2025, more than 50,000 martyrs have been killed in Gaza. Every number is a person. Every person a name.";
    
    typeIntro(introText, "typing-text", () => {
      loadDataAndStart();
    });
  });
  
  function typeIntro(text, targetId, onComplete) {
    const el = document.getElementById(targetId);
    let i = 0;
    const speed = 35;
  
    const interval = setInterval(() => {
      el.textContent += text.charAt(i);
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, speed);
  }
  
  function loadDataAndStart() {
    const datasetUrl = "https://data.techforpalestine.org/api/v2/killed-in-gaza.json";
  
    fetch(datasetUrl)
      .then(response => {
        if (!response.ok) throw new Error(`Network error: ${response.status}`);
        return response.json();
      })
      .then(data => {
        const sorted = sortDatasetByDOB(data);
        createGrid(data);
  
        // Fade out intro
        const intro = document.getElementById("intro-message");
        if (intro) {
          intro.classList.add("fade-out");
          setTimeout(() => intro.remove(), 1000);
        }
      })
      .catch(err => {
        const el = document.getElementById("typing-text");
        if (el) el.textContent = "Failed to load data.";
        console.error(err);
      });
  }
  
  
  function sortDatasetByDOB(data) {
    return data.sort((a, b) => {
      const dobA = a.dob ? new Date(a.dob) : null;
      const dobB = b.dob ? new Date(b.dob) : null;
  
      if (!dobA && !dobB) return 0;
      if (!dobA) return 1; // missing DOB goes last
      if (!dobB) return -1;
  
      return dobB - dobA; // later DOB = younger
    });
  }
  
  
  function createGrid(data) {
    const grid = document.getElementById("grid");
    const count = data.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  
    // Detect mobile
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  
    data.forEach((victim, index) => {
      const cell = document.createElement("div");
      cell.classList.add("grid-cell");
      cell.dataset.index = index; // store index to lookup victim
  
      let color;
      if (victim.age !== undefined) {
        const age = Number(victim.age);
        if (age < 15) {
          color = "#000000";
        } else if (age < 35) {
          color = "#E4312b";
        } else if (age < 50) {
          color = "#ffffff";
        } else {
          color = "#149954";
        }
      } else {
        color = "#cccccc";
      }
      cell.style.backgroundColor = color;
  
      if (!isMobile) {
        cell.addEventListener("mouseenter", () => displayDetails(victim));
      }
  
      grid.appendChild(cell);
    });
  
    if (isMobile) {
      let lastIndex = null;
      grid.addEventListener("touchmove", (e) => {
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && element.classList.contains("grid-cell")) {
          const index = element.dataset.index;
          if (index !== lastIndex) {
            lastIndex = index;
            const victim = data[parseInt(index)];
            displayDetails(victim);
          }
        }
      });
    }
  }
  
  function calculateAgeOnDate(dob, date) {
    const birth = new Date(dob);
    const target = new Date(date);
  
    let age = target.getFullYear() - birth.getFullYear();
  
    const birthdayThisYear = new Date(target.getFullYear(), birth.getMonth(), birth.getDate());
    if (target < birthdayThisYear) {
      age--; // hasn't had birthday yet this year
    }
  
    return age + 1; // age they would be turning on birthday this year
  }
  
  

  function displayDetails(victim) {
    const displayName = victim.name;
    const textName = victim.en_name || victim.name;
    
    let pronoun = "they";
    let possessive = "their";
    if (victim.sex === "f") {
      pronoun = "she";
      possessive = "her";
    } else if (victim.sex === "m") {
      pronoun = "he";
      possessive = "his";
    }
    
    let message = `<h1>${displayName}</h1>`;
    
    if (victim.age !== undefined) {
      if (victim.age < 1) {
        message += `<p>Martyr <b>${textName}</b> was just born when ${pronoun} was murdered by the ongoing Israeli genocide on the Palestinian people of Gaza.</p>`;
      } else {
        const ageClause = victim.age < 20 ? `only ${victim.age} years old` : `${victim.age} years old`;
        message += `<p>Martyr <b>${textName}</b> was ${ageClause} when ${pronoun} was murdered by the ongoing Israeli genocide on the Palestinian people of Gaza.</p>`;
      }
    } else {
      message += `<p>Martyr <b>${displayName}</b> was murdered by the ongoing Israeli genocide on the Palestinian people of Gaza.</p>`;
    }
    
    if (victim.dob) {
      const today = new Date();
      const dob = new Date(victim.dob);
      const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      
      let birthdayMsg = "";

      if (today >= birthdayThisYear) {
        // Birthday already happened.
        const diffDays = Math.floor((today - birthdayThisYear) / (1000 * 60 * 60 * 24));
        if (diffDays < 30) {
          if (diffDays < 7) {
            birthdayMsg = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
          } else if (diffDays === 7) {
            birthdayMsg = `exactly a week ago`;
          } else if (diffDays % 7 === 0) {
            const weeks = diffDays / 7;
            birthdayMsg = `exactly ${weeks} week${weeks === 1 ? '' : 's'} ago`;
          } else {
            const weeks = Math.floor(diffDays / 7);
            const days = diffDays % 7;
            birthdayMsg = `this month, ${weeks} week${weeks === 1 ? '' : 's'} and ${days} day${days === 1 ? '' : 's'} ago`;
          }
          message += `<p>${capitalize(pronoun)} would have just celebrated ${possessive} birthday on ${formatBirthday(birthdayThisYear)} (${birthdayMsg}).</p>`;
        }
      } else {
        // Birthday is upcoming.
        const diffDays = Math.floor((birthdayThisYear - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 30) {
          if (diffDays < 7) {
            birthdayMsg = `in ${diffDays} day${diffDays === 1 ? '' : 's'} from now`;
          } else if (diffDays === 7) {
            birthdayMsg = `in exactly a week from now`;
          } else if (diffDays % 7 === 0) {
            const weeks = diffDays / 7;
            birthdayMsg = `in exactly ${weeks} week${weeks === 1 ? '' : 's'} from now`;
          } else {
            const weeks = Math.floor(diffDays / 7);
            const days = diffDays % 7;
            birthdayMsg = `just ${weeks} week${weeks === 1 ? '' : 's'} and ${days} day${days === 1 ? '' : 's'} from now`;
          }
          if (victim.age !== undefined) {
            message += `<p>${capitalize(pronoun)} was going to turn ${calculateAgeOnDate(victim.dob, birthdayThisYear)} on ${formatBirthday(birthdayThisYear)} (${birthdayMsg}), had Israel stopped bombing Gaza.</p>`;
          } else {
            message += `<p>${capitalize(pronoun)} was going to celebrate ${possessive} birthday on ${formatBirthday(birthdayThisYear)} (${birthdayMsg}), had Israel stopped bombing Gaza.</p>`;
          }
        }
      }
      
      const foundationDate = new Date("1948-05-14");
      if (dob < foundationDate) {
        const diff = calculateDateDifference(dob, foundationDate);
        const diffString = formatDateDiff(diff);
        message += `<p>${capitalize(pronoun)} was ${diffString} older than the state of Israel.</p>`;
      }
    }
    
    document.getElementById("details-display").innerHTML = message;
  }
  

  function calculateDateDifference(startDate, endDate) {
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();
    
    if (days < 0) {
      months--;
      const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      months += 12;
      years--;
    }
    return { years, months, days };
  }
  

  function formatDateDiff(diff) {
    let parts = [];
    if (diff.years > 0) {
      parts.push(`${diff.years} year${diff.years === 1 ? '' : 's'}`);
      parts.push(`${diff.months} month${diff.months === 1 ? '' : 's'}`);
      parts.push(`${diff.days} day${diff.days === 1 ? '' : 's'}`);
    } else if (diff.months > 0) {
      parts.push(`${diff.months} month${diff.months === 1 ? '' : 's'}`);
      parts.push(`${diff.days} day${diff.days === 1 ? '' : 's'}`);
    } else {
      parts.push(`${diff.days} day${diff.days === 1 ? '' : 's'}`);
    }
    if (parts.length > 1) {
      let last = parts.pop();
      return parts.join(', ') + ' and ' + last;
    } else {
      return parts[0];
    }
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  

  function formatBirthday(date) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    return `${monthName} ${day}${ordinalSuffix(day)}`;
  }

  function ordinalSuffix(i) {
    let j = i % 10,
        k = i % 100;
    if (j === 1 && k !== 11) {
      return "st";
    }
    if (j === 2 && k !== 12) {
      return "nd";
    }
    if (j === 3 && k !== 13) {
      return "rd";
    }
    return "th";
  }

  
  