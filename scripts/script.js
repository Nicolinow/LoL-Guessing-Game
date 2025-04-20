/**
 * Copyright 2025 Nicolas Lima
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Este módulo contém toda a lógica do jogo, incluindo:
// - Processamento de entrada do usuário
// - Sistema de validação de respostas
// - Filtragem de campeões através do sistema de texto preditivo com várias verificações
// - Gerenciamento de estatísticas e progresso
const GameModule = (function () {
	let championsData = [];
	let availableChampions = [];
	let skippedQuotes = [];
	let currentQuote = null;
	let correctOption = null;
	let selectedIndex = -1;
	let wrongAttempts = [];
	let currentProgress = 0;
	let triedChampions = new Set();
	let skipsLeft = 2;
	let attemptsLeft = 3;
	let gameStartTime = null;
	let phraseStartTime = null;

	let gameStats = {
		totalPhrases: 0,
		fastestPhrase: { time: 0, quote: "", champion: "" },
		slowestPhrase: { time: 0, quote: "", champion: "" },
		hardestPhrase: { attempts: 0, quote: "", champion: "" },
		totalAttempts: 0,
		correctAttempts: 0,
	};

	const quoteElement = document.getElementById("quote");
	const quoteBox = document.getElementById("quote-box");
	const championInput = document.getElementById("champion-input");
	const autocompleteBox = document.getElementById("autocomplete-box");
	const skipButton = document.getElementById("skip-btn");
	const resetButton = document.getElementById("reset-btn");
	const wrongList = document.getElementById("wrong-list");
	const gameOverScreen = document.getElementById("game-over");
	const playAgainButton = document.getElementById("play-again-btn");

	function initGame() {
		if (!achievementsData || !achievementsData.quotes) {
			quoteElement.textContent = "Erro ao carregar dados!";
			return;
		}

		const decodedData = window.DecryptModule.decrypt(achievementsData.quotes);

		if (!decodedData) {
			quoteElement.textContent = "Erro ao carregar dados!";
			return;
		}

		championsData = decodedData.champions || [];
		availableChampions = [...championsData];

		if (championsData.length === 0) {
			quoteElement.textContent = "Nenhum campeão encontrado!";
			return;
		}

		setupEventListeners();
		updateProgressCounter();
		gameStartTime = Date.now();

		const skipPieces = document.createElement("div");
		skipPieces.className = "skip-pieces";
		skipPieces.innerHTML = `
			<div class="skip-piece"></div>
			<div class="skip-piece"></div>
		`;
		skipButton.appendChild(skipPieces);

		const segments = document.createElement("div");
		segments.className = "attempt-segments";
		segments.innerHTML = `
			<div class="attempt-segment"></div>
			<div class="attempt-segment"></div>
			<div class="attempt-segment"></div>
		`;
		wrongList.parentElement.insertBefore(segments, wrongList);

		const progressElement = document.querySelector(".progress-counter");
		if (progressElement) {
			progressElement.innerHTML = "";

			const progressBar = document.createElement("div");
			progressBar.id = "progress-bar";
			progressBar.className = "progress-bar";

			const textSpan = document.createElement("span");
			textSpan.id = "progress-counter";

			progressElement.appendChild(progressBar);
			progressElement.appendChild(textSpan);
		}

		displayRandomQuote();

		if (window.achievementSystem) {
			window.achievementSystem.init();
			window.achievementSystem.registerGamePlayed();
		}
	}

	function updateUI() {
		skipButton.disabled = skipsLeft === 0;
		updateProgressCounter();
	}

	function updateProgressCounter() {
		const progressCounter = document.getElementById("progress-counter");
		const progressBar = document.getElementById("progress-bar");

		if (progressCounter && progressBar) {
			progressCounter.textContent = `${currentProgress}/${championsData.length}`;
			const progressPercentage = (currentProgress / championsData.length) * 100;
			progressBar.style.width = `${progressPercentage}%`;

			if (progressPercentage > 0) {
				progressBar.classList.add("active");
			} else {
				progressBar.classList.remove("active");
			}

			if (progressPercentage >= 100) {
				progressBar.classList.add("complete");
			} else {
				progressBar.classList.remove("complete");
			}
		}
	}

	function setupEventListeners() {
		championInput.addEventListener("input", handleInput);
		championInput.addEventListener("keydown", handleKeyDown);
		autocompleteBox.addEventListener("click", handleAutocompleteClick);
		resetButton.addEventListener("click", resetGame);
		skipButton.addEventListener("click", handleSkip);
		playAgainButton.addEventListener("click", resetGame);

		const creditsBtn = document.getElementById("credits-btn");
		const creditsModal = document.getElementById("credits-modal");
		if (creditsBtn && creditsModal) {
			creditsBtn.addEventListener("click", function() {
				creditsModal.classList.add("active");
			});

			const closeCreditsBtn = creditsModal.querySelector(".close-modal");
			if (closeCreditsBtn) {
				closeCreditsBtn.addEventListener("click", function() {
					creditsModal.classList.remove("active");
				});
			}
		}

		document.addEventListener("click", function (e) {
			if (!championInput.contains(e.target) && !autocompleteBox.contains(e.target)) {
				hideAutocomplete();
			}
		});
	}

	function handleInput(e) {
		const input = e.target.value.toLowerCase().trim();

		if (input.length === 0) {
			hideAutocomplete();
			return;
		}

		const matches = [];

		for (const champion of availableChampions) {
			if (triedChampions.has(champion.name)) {
				continue;
			}

			const championNameLower = champion.name.toLowerCase();
			if (championNameLower.startsWith(input)) {
				matches.push(champion);
			}
		}

		if (matches.length > 0) {
			autocompleteBox.innerHTML = matches
				.map((champion) => `<div class="champion-option">${champion.name}</div>`)
				.join("");
			autocompleteBox.classList.add("active");
		} else {
			hideAutocomplete();
		}
	}

	function handleKeyDown(e) {
		const options = autocompleteBox.getElementsByClassName("champion-option");

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, options.length - 1);
				updateSelection(options);
				break;
			case "ArrowUp":
				e.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				updateSelection(options);
				break;
			case "Enter":
				e.preventDefault();
				if (championInput.value.trim() === "") {
					if (window.achievementSystem) {
						const gameState = {
							isEmptySubmit: true,
							selectedOption: "",
							correctOption: correctOption,
						};
						window.achievementSystem.checkAchievements(gameState);
					}
					return;
				}

				const isComboboxVisible = autocompleteBox.classList.contains("active");

				if (isComboboxVisible && options.length > 0) {
					if (selectedIndex >= 0 && options[selectedIndex]) {
						checkAnswer(options[selectedIndex].textContent);
					} else {
						checkAnswer(options[0].textContent);
					}
				} else {
					const invalidName = championInput.value.trim();
					const matchesAnyChampion = availableChampions.some(
						(champion) => champion.name.toLowerCase() === invalidName.toLowerCase()
					);

					if (matchesAnyChampion) {
						const exactMatch = availableChampions.find(
							(champion) => champion.name.toLowerCase() === invalidName.toLowerCase()
						);
						checkAnswer(exactMatch.name);
					} else {
						const gameState = {
							isCorrect: false,
							attemptsLeft,
							wrongAttempts,
							phraseTime: Date.now() - phraseStartTime,
							totalPhrases: gameStats.totalPhrases,
							selectedOption: invalidName,
							correctOption,
							isInvalidName: true,
						};

						if (window.achievementSystem) {
							window.achievementSystem.checkAchievements(gameState);
						}

						championInput.value = "";
						championInput.focus();
					}
				}
				break;
		}
	}

	function updateSelection(options) {
		Array.from(options).forEach((opt, idx) => {
			opt.classList.toggle("selected", idx === selectedIndex);
		});
	}

	function hideAutocomplete() {
		autocompleteBox.classList.remove("active");
		selectedIndex = -1;
	}

	function handleAutocompleteClick(e) {
		if (e.target.classList.contains("champion-option")) {
			checkAnswer(e.target.textContent);
		}
	}

	function getRandomQuote() {
		if (!availableChampions.length) {
			return null;
		}

		const championIndex = Math.floor(Math.random() * availableChampions.length);
		const champion = availableChampions[championIndex];
		const quoteIndex = Math.floor(Math.random() * champion.quotes.length);
		return {
			champion: champion.name,
			quote: champion.quotes[quoteIndex],
			championIndex: championIndex,
		};
	}

	function showConfetti() {
		confetti({
			particleCount: 80,
			spread: 100,
			origin: { y: 0.6 },
		});
	}

	function updateWrongList() {
		const segments = document.querySelectorAll(".attempt-segment");
		segments.forEach((segment) => {
			segment.setAttribute("data-champion", "");
			segment.classList.remove("used");
		});

		wrongAttempts.forEach((attempt, index) => {
			if (index < segments.length) {
				segments[index].setAttribute("data-champion", attempt);
				segments[index].classList.add("used");
			}
		});
	}

	function checkAnswer(selectedOption) {
		hideAutocomplete();
		championInput.value = selectedOption;
		triedChampions.add(selectedOption);
		gameStats.totalAttempts++;

		const phraseTime = Date.now() - phraseStartTime;

		const gameState = {
			isCorrect: selectedOption === correctOption,
			attemptsLeft,
			wrongAttempts,
			phraseTime,
			totalPhrases: gameStats.totalPhrases,
			selectedOption,
			correctOption,
		};

		if (window.achievementSystem) {
			window.achievementSystem.checkAchievements(gameState);
		}

		if (selectedOption === correctOption) {
			gameStats.correctAttempts++;
			gameStats.totalPhrases++;

			if (window.bgCanvas) {
				window.bgCanvas.markChampionAsCorrect(correctOption);
			}

			if (gameStats.fastestPhrase.time === 0 || phraseTime < gameStats.fastestPhrase.time) {
				gameStats.fastestPhrase = {
					time: phraseTime,
					quote: currentQuote.quote,
					champion: correctOption,
				};
			}

			if (phraseTime > gameStats.slowestPhrase.time) {
				gameStats.slowestPhrase = {
					time: phraseTime,
					quote: currentQuote.quote,
					champion: correctOption,
				};
			}

			if (wrongAttempts.length > gameStats.hardestPhrase.attempts) {
				gameStats.hardestPhrase = {
					attempts: wrongAttempts.length,
					quote: currentQuote.quote,
					champion: correctOption,
				};
			}

			currentProgress++;
			showConfetti();
			wrongAttempts = [];
			updateWrongList();
			triedChampions.clear();
			attemptsLeft = 3;
			updateUI();

			quoteBox.classList.add("slide-out");

			setTimeout(() => {
				availableChampions = availableChampions.filter((champion) => champion.name !== correctOption);

				if (!availableChampions.length && !skippedQuotes.length) {
					showGameOver();
					return;
				}

				displayRandomQuote();
				quoteBox.classList.remove("slide-out");
				championInput.disabled = false;
				championInput.value = "";
				championInput.focus();
			}, 500);
		} else {
			if (!wrongAttempts.includes(selectedOption)) {
				wrongAttempts.push(selectedOption);
				updateWrongList();
				attemptsLeft--;
				updateUI();

				championInput.placeholder = getRandomPlaceholderPhrase();
				const segments = document.querySelectorAll(".attempt-segment");
				const usedSegments = 3 - attemptsLeft;
				segments[usedSegments - 1].classList.add("used");

				if (attemptsLeft === 0) {
					showGameOver();
					return;
				}
			}

			championInput.value = "";
			championInput.disabled = false;
			championInput.focus();
		}
	}

	function displayRandomQuote() {
		championInput.value = "";
		hideAutocomplete();
		wrongAttempts = [];
		updateWrongList();
		triedChampions.clear();
		attemptsLeft = 3;
		updateUI();

		championInput.placeholder = getRandomPlaceholderPhrase();

		if (skippedQuotes.length > 0) {
			const randomIndex = Math.floor(Math.random() * skippedQuotes.length);
			currentQuote = skippedQuotes.splice(randomIndex, 1)[0];
		} else {
			currentQuote = getRandomQuote();
		}

		if (!currentQuote) {
			showGameOver();
			return;
		}

		phraseStartTime = Date.now();
		quoteElement.textContent = `"${currentQuote.quote}"`;
		correctOption = currentQuote.champion;
		championInput.disabled = false;
		championInput.focus();
	}

	function resetGame() {
		availableChampions = [...championsData];
		wrongAttempts = [];
		attemptsLeft = 3;
		updateWrongList();
		triedChampions.clear();
		currentProgress = 0;
		skipsLeft = 2;
		for (let i = 0; i < 2; i++) {
			const piece = skipButton.querySelectorAll(".skip-piece")[i];
			if (piece) piece.classList.remove("used");
		}

		updateUI();
		championInput.disabled = false;
		championInput.value = "";
		championInput.placeholder = getRandomPlaceholderPhrase();
		displayRandomQuote();
		hideGameOver();

		gameStats = {
			totalPhrases: 0,
			fastestPhrase: { time: 0, quote: "", champion: "" },
			slowestPhrase: { time: 0, quote: "", champion: "" },
			hardestPhrase: { attempts: 0, quote: "", champion: "" },
			totalAttempts: 0,
			correctAttempts: 0,
		};

		if (window.achievementSystem) {
			window.achievementSystem.resetRunProgress();
			window.achievementSystem.registerGamePlayed();
		}

		gameStartTime = Date.now();

		if (window.bgCanvas) {
			window.bgCanvas.resetCorrectChampions();
		}
	}

	function hideGameOver() {
		const gameOverScreen = document.getElementById("game-over");

		gameOverScreen.classList.remove("active");
		gameOverScreen.style.opacity = "0";

		setTimeout(() => {
			gameOverScreen.style.display = "none";
		}, 300);
	}

	function handleSkip() {
		if (skipsLeft > 0) {
			skipsLeft--;

			updateUI();
			displayRandomQuote();

			const pieces = skipButton.querySelectorAll(".skip-piece");
			pieces[skipsLeft].classList.add("used");
		}
	}

	function getRandomPlayAgainPhrase() {
		const phrases = [
			"Jogar Novamente",
			"Mais Uma Partida",
			"Tentar Outra Vez",
			"Voltar ao Campo de Batalha",
			"Nova Rodada",
			"Mais Uma Chance",
			"Não Desisto Fácil",
			"Apenas Mais Uma",
			"Quero Outra Chance",
			"Acho que Agora Vai",
			"Dobro ou Nada!",
			"Mostrar Minha Habilidade",
			"Ainda Não Terminei",
			"Não Foi Dessa Vez… Ainda",
			"Mais Uma Rodada",
			"Quem não arrisca...",
			"Mais uma pra conta",
			"OK",
		];

		return phrases[Math.floor(Math.random() * phrases.length)];
	}

	function getRandomPlaceholderPhrase() {
		const phrases = [
			"Certeza que é...",
			"É óbvio que é...",
			"Não tem erro, é...",
			"Sem dúvidas, é...",
			"Claramente é...",
			"Acho que é...",
			"Provavelmente é...",
			"Se não for, é quase...",
			"Já sei quem é: é...",
			"Dou all-in no...",
			"Vai esse aqui mesmo...",
			"Essa vale dobrado: é...",
			"Vai na fé, é...",
			"Não me responsabilizo se não for, mas...",
			"Tô sentindo que é...",
			"Se errar essa, nem jogo mais...",
			"Não tenho provas, mas é...",
		];

		return phrases[Math.floor(Math.random() * phrases.length)];
	}

	function showGameOver() {
		if (!gameStartTime) gameStartTime = Date.now() - 1000;
		const totalTime = Math.floor((Date.now() - gameStartTime) / 1000);
		const minutes = Math.floor(totalTime / 60);
		const seconds = totalTime % 60;

		const answerSpan = document.getElementById("answer");
		answerSpan.textContent = correctOption;
		answerSpan.classList.add("hidden-answer");
		answerSpan.title = "Clique para revelar/ocultar";
		answerSpan.style.cursor = "pointer";

		answerSpan.onclick = function () {
			this.classList.toggle("hidden-answer");
		};

		document.getElementById("total-phrases").textContent = `${gameStats.totalPhrases}/${championsData.length}`;
		document.getElementById("total-time").textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;

		if (gameStats.fastestPhrase.time !== 0) {
			document.getElementById("fastest-phrase").textContent = `${gameStats.fastestPhrase.champion} (${Math.floor(
				gameStats.fastestPhrase.time / 1000
			)}s)`;
		} else {
			document.getElementById("fastest-phrase").textContent = "Nenhum";
		}

		if (gameStats.slowestPhrase.champion) {
			document.getElementById("slowest-phrase").textContent = `${gameStats.slowestPhrase.champion} (${Math.floor(
				gameStats.slowestPhrase.time / 1000
			)}s)`;
		} else {
			document.getElementById("slowest-phrase").textContent = "Nenhum";
		}

		if (gameStats.hardestPhrase.champion) {
			document.getElementById(
				"hardest-phrase"
			).textContent = `${gameStats.hardestPhrase.champion} (${gameStats.hardestPhrase.attempts} tentativas)`;
		} else {
			document.getElementById("hardest-phrase").textContent = "Nenhum";
		}

		document.getElementById("accuracy").textContent = `${Math.round(
			(gameStats.correctAttempts / gameStats.totalAttempts) * 100 || 0
		)}%`;

		document.getElementById("play-again-btn").textContent = getRandomPlayAgainPhrase();

		gameOverScreen.style.display = "flex";
		gameOverScreen.style.opacity = "0";

		gameOverScreen.offsetHeight;

		gameOverScreen.style.opacity = "1";
		gameOverScreen.classList.add("active");

		championInput.disabled = true;
		championInput.value = "";
	}

	return {
		init: initGame,
		reset: resetGame,
	};
})();

window.GameModule = GameModule;
