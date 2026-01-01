// JEE Mains 2024 Percentile and Rank Data
// Based on official NTA statistics

const jeeMainsData = [
  {
    "score_range": "300 - 281",
    "percentile_range": "100 - 99.99889145",
    "rank_range": null
  },
  {
    "score_range": "271 - 280",
    "percentile_range": "99.994681 - 99.997394",
    "rank_range": "55–24"
  },
  {
    "score_range": "263 - 270",
    "percentile_range": "99.99099029 - 99.99402992",
    "rank_range": "103–55"
  },
  {
    "score_range": "250 - 262",
    "percentile_range": "99.97720562 - 99.98881945",
    "rank_range": "402–103"
  },
  {
    "score_range": "241 - 250",
    "percentile_range": "99.96016355 - 99.97503421",
    "rank_range": "402–103"
  },
  {
    "score_range": "231 - 240",
    "percentile_range": "99.934980423 - 99.9563645",
    "rank_range": "979–402"
  },
  {
    "score_range": "221 - 230",
    "percentile_range": "99.90111347 - 99.92890132",
    "rank_range": "979–402"
  },
  {
    "score_range": "211 - 220",
    "percentile_range": "99.85161647 - 99.89373231",
    "rank_range": "2004–979"
  },
  {
    "score_range": "201 - 210",
    "percentile_range": "99.79506319 - 99.84521216",
    "rank_range": "2004–979"
  },
  {
    "score_range": "191 - 200",
    "percentile_range": "99.7108319 - 99.782472",
    "rank_range": "3900–2004"
  },
  {
    "score_range": "181 - 190",
    "percentile_range": "99.59739985 - 99.68857923",
    "rank_range": "3900–2004"
  },
  {
    "score_range": "171 - 180",
    "percentile_range": "99.4569391 - 99.5731938",
    "rank_range": "7000–3900"
  },
  {
    "score_range": "161 - 170",
    "percentile_range": "99.272084675 - 99.43121439",
    "rank_range": "7000–3900"
  },
  {
    "score_range": "151 - 160",
    "percentile_range": "99.0286144 - 99.239737707",
    "rank_range": "12200–7000"
  },
  {
    "score_range": "141 - 150",
    "percentile_range": "98.732389626 - 98.990296995",
    "rank_range": "12200–7000"
  },
  {
    "score_range": "131 - 140",
    "percentile_range": "98.317414934 - 98.666935862",
    "rank_range": null
  },
  {
    "score_range": "121 - 130",
    "percentile_range": "97.811260869 - 98.254132108",
    "rank_range": null
  },
  {
    "score_range": "111 - 120",
    "percentile_range": "97.142937 - 97.685672",
    "rank_range": null
  },
  {
    "score_range": "101 - 110",
    "percentile_range": "96.204550067 - 96.978272172",
    "rank_range": null
  },
  {
    "score_range": "91 - 100",
    "percentile_range": "94.99859416 - 96.064850243",
    "rank_range": null
  },
  {
    "score_range": "81 - 90",
    "percentile_range": "93.471231279 - 94.749479246",
    "rank_range": null
  },
  {
    "score_range": "71 - 80",
    "percentile_range": "91.072128311 - 93.152971850",
    "rank_range": null
  },
  {
    "score_range": "61 - 70",
    "percentile_range": "87.512225091 - 90.702200570",
    "rank_range": null
  },
  {
    "score_range": "51 - 60",
    "percentile_range": "82.016062766 - 86.907944654",
    "rank_range": null
  },
  {
    "score_range": "41 - 50",
    "percentile_range": "73.287808775 - 80.982153808",
    "rank_range": null
  },
  {
    "score_range": "31 - 40",
    "percentile_range": "58.151490185 - 71.302052295",
    "rank_range": null
  },
  {
    "score_range": "21 - 30",
    "percentile_range": "37.694529563 - 56.569310977",
    "rank_range": null
  },
  {
    "score_range": "11 - 20",
    "percentile_range": "13.495849710 - 33.229128336",
    "rank_range": null
  },
  {
    "score_range": "0 - 10",
    "percentile_range": "0.84351797 - 9.695406505",
    "rank_range": null
  }
];

// Function to get JEE Mains statistics based on score
const getJeeMainsStats = (marks) => {
  // Handle edge cases
  if (marks < 0) {
    return { 
      percentileRange: "0", 
      rankRange: "Not Available" 
    };
  }
  
  if (marks > 300) {
    return { 
      percentileRange: "100", 
      rankRange: "1" 
    };
  }
  
  // Find the matching score range
  for (const data of jeeMainsData) {
    const [minScore, maxScore] = data.score_range.split(' - ').map(Number);
    
    if (marks >= minScore && marks <= maxScore) {
      return {
        percentileRange: data.percentile_range,
        rankRange: data.rank_range || "Not Available"
      };
    }
  }
  
  // Fallback for any unmatched scores
  return { 
    percentileRange: "Data Not Available", 
    rankRange: "Data Not Available" 
  };
};

export { jeeMainsData, getJeeMainsStats };