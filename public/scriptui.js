let intervalId;
let timerInterval;
let autoReloadEnabled = false;
function startTimer() {
    let seconds = 60;
    const reloadTimer = document.getElementById('timer');
    timerInterval = setInterval(() => {
        seconds--;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        reloadTimer.innerHTML = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        if (seconds <= 0) {
            clearInterval(timerInterval);
            reloadTimer.innerHTML = '00:00';
        }
    }, 1000);
}
async function fetchData() {
    const button = document.getElementById('reloadBtn');
    const originalText = button.innerHTML;
    const reloadTimer = document.getElementById('timer');

    button.disabled = true;
    button.innerHTML = 'Loading <span class="spinner"></span>';
    if (autoReloadEnabled) {
        clearInterval(timerInterval);
        reloadTimer.innerHTML = '00:00';
    }
    try {
        const currentUrl = window.location.href;
        const response = await fetch(`${currentUrl.replace('/ui', '/api-ui')}`);
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
            startTimer();
        }
    }
}
document.getElementById('reloadBtn').addEventListener('click', () => {
    clearInterval(intervalId);
    clearInterval(timerInterval);
    fetchData().then();
});
document.getElementById('autoReload').addEventListener('change', (event) => {
    autoReloadEnabled = event.target.checked;
    if (autoReloadEnabled) {
        clearInterval(intervalId);
        clearInterval(timerInterval);
        startTimer();
        intervalId = setInterval(fetchData, 60000);
    } else {
        clearInterval(intervalId);
        clearInterval(timerInterval);
        document.getElementById('timer').innerHTML = '00:00';
    }
});
// first load data
window.addEventListener('load', fetchData);