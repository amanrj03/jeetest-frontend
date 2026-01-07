// JEE Mains 2024 Percentile and Rank Data
// Based on official NTA statistics - Updated with latest data

const jeeMainsData = [
  {
    "score_range": "290 - 280",
    "percentile_range": "99.9989 - 99.9974",
    "rank_range": "1 - 36"
  },
  {
    "score_range": "280 - 260",
    "percentile_range": "99.9947 - 99.9758",
    "rank_range": "36 - 428"
  },
  {
    "score_range": "260 - 240",
    "percentile_range": "99.9657 - 99.8450",
    "rank_range": "428 - 755"
  },
  {
    "score_range": "240 - 220",
    "percentile_range": "99.8450 - 99.6510",
    "rank_range": "755 - 1189"
  },
  {
    "score_range": "220 - 210",
    "percentile_range": "99.6510 - 99.4566",
    "rank_range": "1189 - 1893"
  },
  {
    "score_range": "210 - 200",
    "percentile_range": "99.4566 - 99.0777",
    "rank_range": "1893 - 2720"
  },
  {
    "score_range": "200 - 190",
    "percentile_range": "99.0777 - 98.9036",
    "rank_range": "2720 - 3803"
  },
  {
    "score_range": "190 - 180",
    "percentile_range": "98.9036 - 98.5640",
    "rank_range": "3803 - 5320"
  },
  {
    "score_range": "180 - 170",
    "percentile_range": "98.5640 - 98.4036",
    "rank_range": "5320 - 7564"
  },
  {
    "score_range": "170 - 160",
    "percentile_range": "98.4036 - 98.2064",
    "rank_range": "7564 - 9564"
  },
  {
    "score_range": "160 - 150",
    "percentile_range": "98.2064 - 98.0785",
    "rank_range": "9564 - 13163"
  },
  {
    "score_range": "150 - 140",
    "percentile_range": "98.0785 - 97.8778",
    "rank_range": "13163 - 17223"
  },
  {
    "score_range": "140 - 130",
    "percentile_range": "97.8778 - 97.4488",
    "rank_range": "17223 - 23133"
  },
  {
    "score_range": "130 - 120",
    "percentile_range": "97.4488 - 97.3542",
    "rank_range": "23133 - 29340"
  },
  {
    "score_range": "120 - 110",
    "percentile_range": "97.3542 - 96.0649",
    "rank_range": "29340 - 37440"
  },
  {
    "score_range": "110 - 100",
    "percentile_range": "96.0649 - 95.6348",
    "rank_range": "37440 - 47979"
  },
  {
    "score_range": "100 - 90",
    "percentile_range": "95.6348 - 94.9645",
    "rank_range": "47979 - 61621"
  },
  {
    "score_range": "90 - 80",
    "percentile_range": "94.9645 - 92.7234",
    "rank_range": "61621 - 76271"
  },
  {
    "score_range": "80 - 70",
    "percentile_range": "92.7234 - 90.4108",
    "rank_range": "76271 - 102421"
  },
  {
    "score_range": "70 - 60",
    "percentile_range": "90.4108 - 87.0670",
    "rank_range": "102421 - 136085"
  },
  // Extended data for lower scores (estimated based on trends)
  {
    "score_range": "60 - 50",
    "percentile_range": "87.0670 - 82.5000",
    "rank_range": "136085 - 175000"
  },
  {
    "score_range": "50 - 40",
    "percentile_range": "82.5000 - 75.0000",
    "rank_range": "175000 - 250000"
  },
  {
    "score_range": "40 - 30",
    "percentile_range": "75.0000 - 65.0000",
    "rank_range": "250000 - 350000"
  },
  {
    "score_range": "30 - 20",
    "percentile_range": "65.0000 - 50.0000",
    "rank_range": "350000 - 500000"
  },
  {
    "score_range": "20 - 10",
    "percentile_range": "50.0000 - 30.0000",
    "rank_range": "500000 - 700000"
  },
  {
    "score_range": "10 - 0",
    "percentile_range": "30.0000 - 0.0000",
    "rank_range": "700000 - 1000000"
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
  
  // Handle perfect score (300)
  if (marks === 300) {
    return {
      percentileRange: "100",
      rankRange: "1"
    };
  }
  
  // Find the matching score range
  for (const data of jeeMainsData) {
    const [maxScore, minScore] = data.score_range.split(' - ').map(Number);
    
    if (marks >= minScore && marks <= maxScore) {
      return {
        percentileRange: data.percentile_range,
        rankRange: data.rank_range
      };
    }
  }
  
  // Fallback for any unmatched scores
  return { 
    percentileRange: "Data Not Available", 
    rankRange: "Data Not Available" 
  };
};

// Function to get detailed stats with individual percentile and rank estimates
const getDetailedJeeMainsStats = (marks) => {
  const stats = getJeeMainsStats(marks);
  
  if (stats.percentileRange === "Data Not Available") {
    return stats;
  }
  
  // Extract percentile range and estimate individual percentile
  const percentileRange = stats.percentileRange.split(' - ');
  const rankRange = stats.rankRange.split(' - ');
  
  let estimatedPercentile, estimatedRank;
  
  if (percentileRange.length === 2) {
    const minPercentile = parseFloat(percentileRange[1]);
    const maxPercentile = parseFloat(percentileRange[0]);
    estimatedPercentile = ((minPercentile + maxPercentile) / 2).toFixed(4);
  } else {
    estimatedPercentile = percentileRange[0];
  }
  
  if (rankRange.length === 2) {
    const minRank = parseInt(rankRange[0]);
    const maxRank = parseInt(rankRange[1]);
    estimatedRank = Math.round((minRank + maxRank) / 2);
  } else {
    estimatedRank = rankRange[0];
  }
  
  return {
    percentileRange: stats.percentileRange,
    rankRange: stats.rankRange,
    estimatedPercentile,
    estimatedRank,
    marks
  };
};

export { jeeMainsData, getJeeMainsStats, getDetailedJeeMainsStats };