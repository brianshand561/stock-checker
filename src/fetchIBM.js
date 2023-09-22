async function fetchIBMPrice() {
    
    try {
        response = await fetch(`https://y6xlawkx1f.execute-api.us-east-1.amazonaws.com/prod/ibm`);
        console.log("lambda finished")
        const data = await response.json();
        console.log(data)
        document.getElementById('stockPrice').innerText = data.price;
        document.getElementById('popup').style.display = 'block';
    } catch (error) {
        console.error('Error fetching stock price:', error);
    }
}
