let intervalId;
let autoReloadEnabled = true;
async function fetchData() {
    const button = document.getElementById('reloadBtn');
    const originalText = button.innerHTML;

    button.disabled = true;
    button.innerHTML = 'Loading <span class="spinner"></span>';
    try {
        const currentUrl = window.location.href;
        const response = await fetch(`${currentUrl}api-rest`);
        const data = await response.json();

        if (data.used && data.duration) {
            document.getElementById('current_volume').innerText = data.used.current_volume;
            document.getElementById('monthly_used').innerText = data.used.monthly_used;
            document.getElementById('total_volume').innerText = data.used.total_volume;

            document.getElementById('current_session').innerText = data.duration.current_session;
            document.getElementById('monthly_total').innerText = data.duration.monthly_total;
            document.getElementById('total_duration').innerText = data.duration.total_duration;
            document.getElementById('last_reset').innerText =`Last reset: ${data.duration.last_reset}`;
        } else {
            alert("Unexpected data format.");
        }

    } catch (err) {
        alert("Failed to fetch data from server.");
        console.error(err);
    } finally {
        button.disabled = false;
        button.innerHTML = 'Reload';
        if (autoReloadEnabled) {
            clearInterval(intervalId);
            intervalId = setInterval(fetchData, 5000);
        }
    }
}
document.getElementById('reloadBtn').addEventListener('click', () => {
    clearInterval(intervalId);
    fetchData().then();
});
document.getElementById('autoReload').addEventListener('change', (event) => {
    autoReloadEnabled = event.target.checked;
    if (autoReloadEnabled) {
        clearInterval(intervalId);
        intervalId = setInterval(fetchData, 5000);
    } else {
        clearInterval(intervalId);
    }
});
// first load data
window.addEventListener('load', fetchData);