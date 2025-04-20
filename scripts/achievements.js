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

// Sistema de conquistas que gerencia todas as métricas de progresso, desbloqueio de campeões
// e notificações de conquistas. Implementa lógica complexa para detecção de condições específicas
// como sequências de acertos, padrões de jogo e registro de atividade do usuário ao longo do tempo.
const achievementSystem = (function () {
	const CHAMPION_ICON_BASE_URL = "https://ddragon.leagueoflegends.com/cdn/13.6.1/img/champion/";

	let achievements = {};
	let championInfo = {};

	let championCorrectCounter = {};
	let championErrorCounter = {};
	let wrongChampionsSet = new Set();
	let lastAnswers = [];
	let dailyPlayCount = {};
	let weekendPlayCount = {};
	let dailyLoginStreak = [];
	let totalPlayCount = 0;
	let uniqueCorrectChampions = new Set();


	function loadEncodedData() {
		if (typeof achievementsData !== "undefined") {
			if (achievementsData.achievements) {
				const decodedAchievements = DecryptModule.decrypt(achievementsData.achievements);
				if (decodedAchievements) {
					achievements = decodedAchievements;
				}
			}

			if (achievementsData.championInfo) {
				const decodedChampionInfo = DecryptModule.decrypt(achievementsData.championInfo);
				if (decodedChampionInfo) {
					championInfo = decodedChampionInfo;
				}
			}
		}

		allChampions = Object.keys(championInfo);
	}

	let allChampions = [];
	let unlockedChampions = [];

	function setupModal() {
		const modal = document.getElementById("achievements-modal");
		const btn = document.getElementById("achievements-btn");
		const closeBtn = modal.querySelector(".close-modal");
		const tabBtns = document.querySelectorAll(".achievements-tabs .tab");
		const achievementsTab = document.getElementById("achievements-tab-btn");
		const championsTab = document.getElementById("champions-tab-btn");
		const achievementsContainer = document.getElementById("achievements-container");
		const championsContainer = document.getElementById("champions-container");

		function activateAchievementsTab() {
			tabBtns.forEach((t) => t.classList.remove("active"));
			achievementsTab.classList.add("active");
			achievementsContainer.style.display = "block";
			championsContainer.style.display = "none";
			updateModal();
		}

		function activateChampionsTab() {
			tabBtns.forEach((t) => t.classList.remove("active"));
			championsTab.classList.add("active");
			achievementsContainer.style.display = "none";
			championsContainer.style.display = "block";
			updateChampionsGrid();
		}

		btn.addEventListener("click", () => {
			modal.classList.add("active");
			activateAchievementsTab();
		});

		closeBtn.addEventListener("click", () => {
			modal.classList.remove("active");
		});

		achievementsTab.addEventListener("click", activateAchievementsTab);
		championsTab.addEventListener("click", activateChampionsTab);

		generateChampionsGrid();
		activateAchievementsTab();
	}

	function setupResetButton() {
		const resetBtn = document.getElementById("reset-achievements-btn");
		if (resetBtn) {
			resetBtn.addEventListener("click", function () {
				if (confirm("Tem certeza que deseja resetar TODAS as conquistas? Esta ação não pode ser desfeita!")) {
					resetAllAchievements();
				}
			});
		}
	}

	function showToast(achievement) {
		const trophyEmoji = "🏆";
		const content = `
			<div class="toast-content">
				<span class="trophy">${trophyEmoji}</span>
				<div class="toast-text">					
					<h3>${achievement.description}</h3>
					<p>${achievement.name}</p>
				</div>
			</div>
		`;

		Toastify({
			text: content,
			duration: 5000,
			gravity: "bottom",
			position: "right",
			stopOnFocus: true,
			className: "achievement-toast-notification",
			escapeMarkup: false,
			style: {
				background: "linear-gradient(45deg, var(--gold-gradient-1) 20%, var(--surface-color) 70%)",
				borderRadius: "8px",
				boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
				padding: "1rem",
				cursor: "default",
				maxWidth: "400px",
				width: "400px",
			},
		}).showToast();
	}

	function unlockAchievement(achievementId) {
		const achievement = achievements[achievementId];
		if (achievement && !achievement.unlocked) {
			achievement.unlocked = true;
			showToast(achievement);
			updateModal();
			saveProgress();
		}
	}

	function updateModal() {
		const grid = document.getElementById("achievements-grid");
		if (!grid) return;

		grid.innerHTML = "";

		Object.values(achievements).forEach((achievement) => {
			const item = document.createElement("div");
			item.className = `achievement-item ${achievement.unlocked ? "unlocked" : ""}`;

			item.innerHTML = `
                    <h3>${achievement.name}</h3>
                    <p>${achievement.description}</p>
					<img src="${achievement.image}"/>
                `;

			grid.appendChild(item);
		});
	}

	function generateChampionsGrid() {
		const championsGrid = document.getElementById("champions-grid");
		if (!championsGrid) {
			return;
		}

		championsGrid.innerHTML = "";

		allChampions.forEach((championName) => {
			const info = championInfo[championName];
			const isUnlocked = unlockedChampions.includes(championName);
			const unlockDate = getChampionUnlockDate(championName);

			const championWrapper = document.createElement("div");
			championWrapper.className = "champion-wrapper";

			const championItem = document.createElement("div");
			championItem.className = `champion-icon ${isUnlocked ? "unlocked" : "locked"}`;
			championItem.dataset.name = championName;

			const tooltip = document.createElement("div");
			tooltip.className = "champion-tooltip";

			if (isUnlocked) {
				tooltip.innerHTML = `
					<h4>${info.title}</h4>
					<p>Acertou ${championName}</p>
					<small>Desbloqueado em ${unlockDate}</small>
				`;
				const championImage = document.createElement("img");
				championImage.src = `${CHAMPION_ICON_BASE_URL}${info.image}`;
				championImage.alt = championName;

				championImage.onerror = function () {
					championImage.remove();
					if (!championItem.querySelector(".champion-fallback-text")) {
						const fallbackText = document.createElement("span");
						fallbackText.textContent = "Sem imagem ainda ;-;";
						fallbackText.className = "champion-fallback-text";
						championItem.appendChild(fallbackText);
					}
				};
				championItem.appendChild(championImage);
			} else {
				tooltip.innerHTML = `
					<p>Este campeão ainda não foi desbloqueado.</p>
					`;
				const questionMark = document.createElement("div");
				questionMark.className = "question-mark";
				questionMark.textContent = "?";
				championItem.appendChild(questionMark);
			}

			// Adiciona eventos de clique e hover
			championItem.addEventListener("click", (e) => {
				e.stopPropagation();
				document.querySelectorAll(".champion-tooltip.active").forEach((t) => {
					if (t !== tooltip) t.classList.remove("active");
				});
				positionTooltip(tooltip, e);
				tooltip.classList.add("active");
			});

			// Adiciona eventos de hover para desktop
			championItem.addEventListener("mouseenter", (e) => {
				positionTooltip(tooltip, e);
				tooltip.classList.add("active");
			});

			championItem.addEventListener("mouseleave", () => {
				tooltip.classList.remove("active");
			});

			championWrapper.appendChild(championItem);
			championWrapper.appendChild(tooltip);
			championsGrid.appendChild(championWrapper);
		});

		document.addEventListener("click", function hideAllTooltips(e) {
			if (!e.target.closest(".champion-icon")) {
				document.querySelectorAll(".champion-tooltip.active").forEach((t) => t.classList.remove("active"));
			}
		});
	}

	function positionTooltip(tooltip, event) {
		const rect = event.target.getBoundingClientRect();
		const tooltipWidth = 220;
		const tooltipHeight = tooltip.offsetHeight || 120;
		const isLocked = event.target.classList.contains("locked");
		let left, top;

		left = rect.left + rect.width / 2 - tooltipWidth / 2;

		if (left < 10) left = 10;
		if (left + tooltipWidth > window.innerWidth - 10) {
			left = window.innerWidth - tooltipWidth - 10;
		}

		const verticalMargin = isLocked ? 10 : 20;
		top = rect.top - tooltipHeight - verticalMargin;

		const minTopPosition = 5;
		if (top < minTopPosition) {
			top = rect.bottom + verticalMargin;
			tooltip.classList.add("arrow-top");
		} else {
			tooltip.classList.remove("arrow-top");
		}

		tooltip.style.left = `${left}px`;
		tooltip.style.top = `${top}px`;
	}

	function updateChampionsGrid() {
		const championsGrid = document.getElementById("champions-grid");
		if (!championsGrid) return;

		const wrappers = championsGrid.querySelectorAll(".champion-wrapper");

		wrappers.forEach((wrapper, index) => {
			const championName = allChampions[index];
			const isUnlocked = unlockedChampions.includes(championName);
			const info = championInfo[championName];
			const unlockDate = getChampionUnlockDate(championName);

			const icon = wrapper.querySelector(".champion-icon");

			if (isUnlocked && !icon.classList.contains("unlocked")) {
				icon.classList.remove("locked");
				icon.classList.add("unlocked");
				icon.dataset.name = championName;

				icon.innerHTML = "";
				const championImage = document.createElement("img");
				championImage.src = `${CHAMPION_ICON_BASE_URL}${info.image}`;
				championImage.alt = championName;
				icon.appendChild(championImage);

				const tooltip = wrapper.querySelector(".champion-tooltip");
				tooltip.innerHTML = `
					<h4>${info.title}</h4>
					<p>Acertou ${championName}</p>
					<small>Desbloqueado em ${unlockDate}</small>
				`;

				icon.addEventListener("mouseenter", (e) => {
					positionTooltip(tooltip, e);
					tooltip.classList.add("active");
				});

				icon.addEventListener("mousemove", (e) => {
					positionTooltip(tooltip, e);
				});

				icon.addEventListener("mouseleave", () => {
					tooltip.classList.remove("active");
				});

				icon.addEventListener("touchstart", (e) => {
					e.preventDefault();
					positionTooltip(tooltip, e);
					tooltip.classList.add("active");

					document.querySelectorAll(".champion-tooltip.active").forEach((t) => {
						if (t !== tooltip) t.classList.remove("active");
					});
				});
			}
		});
	}

	function getChampionUnlockDate(championName) {
		const unlockedDates = JSON.parse(localStorage.getItem("championUnlockDates") || "{}");
		return unlockedDates[championName] || formatDate(new Date());
	}

	function formatDate(date) {
		const day = date.getDate().toString().padStart(2, "0");
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const year = date.getFullYear();
		const hours = date.getHours().toString().padStart(2, "0");
		const minutes = date.getMinutes().toString().padStart(2, "0");

		return `${day}/${month}/${year} às ${hours}:${minutes}`;
	}

	function checkAchievements(gameState) {
		const {
			isCorrect,
			wrongAttempts,
			attemptsLeft,
			correctOption,
			selectedOption,
			phraseTime,
			isEmptySubmit,
			isInvalidName,
		} = gameState;

		if (isEmptySubmit) {
			unlockAchievement("sleepy");
			return;
		}

		if (isInvalidName && selectedOption && selectedOption.length > 0 && !achievements.niceTry.unlocked) {
			unlockAchievement("niceTry");
			return;
		}

		if (!isCorrect && selectedOption && selectedOption.length > 0) {
			if (!allChampions.includes(selectedOption) && !achievements.niceTry.unlocked) {
				unlockAchievement("niceTry");
			}

			if (
				selectedOption &&
				correctOption &&
				allChampions.includes(selectedOption) &&
				selectedOption !== correctOption
			) {
				let foundPrefix = false;
				let matchingPrefix = "";

				for (let prefixLength = 1; prefixLength <= 3; prefixLength++) {
					if (selectedOption.length >= prefixLength) {
						const prefix = selectedOption.substring(0, prefixLength).toLowerCase();
						const matchingChampions = allChampions.filter((champion) =>
							champion.toLowerCase().startsWith(prefix)
						);

						if (matchingChampions.length === 2) {
							const [option1, option2] = matchingChampions;

							if (
								(selectedOption === option1 && correctOption === option2) ||
								(selectedOption === option2 && correctOption === option1)
							) {
								foundPrefix = true;
								matchingPrefix = prefix;
								break;
							}
						}
					}
				}

				if (foundPrefix && !achievements.holdTheEmotion.unlocked) {
					unlockAchievement("holdTheEmotion");
				}
			}
		}

		if (!isCorrect && attemptsLeft === 0 && wrongAttempts.length >= 3) {
			unlockAchievement("participationAward");
		}

		totalPlayCount++;
		if (totalPlayCount >= 50 && !achievements.cantStop.unlocked) {
			unlockAchievement("cantStop");
		}

		const today = new Date().toLocaleDateString();
		if (!dailyLoginStreak.includes(today)) {
			dailyLoginStreak.push(today);

			if (dailyLoginStreak.length >= 7) {
				const sortedDates = [...dailyLoginStreak].sort();
				let hasStreak = false;

				for (let i = 0; i <= sortedDates.length - 7; i++) {
					const startDate = new Date(sortedDates[i]);
					const endDate = new Date(sortedDates[i + 6]);
					const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

					if (daysDiff === 6) {
						hasStreak = true;
						break;
					}

					if (hasStreak && !achievements.mainGame.unlocked) {
						unlockAchievement("mainGame");
					}
				}
			}
		}

		if (isCorrect && correctOption) {
			unlockChampion(correctOption);
			uniqueCorrectChampions.add(correctOption);
			championCorrectCounter[correctOption] = (championCorrectCounter[correctOption] || 0) + 1;

			if (championCorrectCounter[correctOption] >= 10 && !achievements.mainMemory.unlocked) {
				achievements.mainMemory.progress = championCorrectCounter[correctOption];
				unlockAchievement("mainMemory");
			}

			if (uniqueCorrectChampions.size >= 100 && !achievements.runeterraEncyclopedia.unlocked) {
				achievements.runeterraEncyclopedia.progress = uniqueCorrectChampions.size;
				unlockAchievement("runeterraEncyclopedia");
			}

			if (uniqueCorrectChampions.size === allChampions.length && !achievements.congratsIThink.unlocked) {
				unlockAchievement("congratsIThink");
			}
		} else if (!isCorrect && correctOption) {
			if (selectedOption && selectedOption.length > 0) {
				wrongChampionsSet.add(correctOption);

				if (allChampions.includes(selectedOption)) {
					championErrorCounter[selectedOption] = (championErrorCounter[selectedOption] || 0) + 1;

					if (championErrorCounter[selectedOption] >= 3 && !achievements.notThisOne.unlocked) {
						achievements.notThisOne.progress = championErrorCounter[selectedOption];
						unlockAchievement("notThisOne");
					}
				}

				if (
					!allChampions.includes(selectedOption) &&
					selectedOption.length > 0 &&
					!achievements.niceTry.unlocked
				) {
					unlockAchievement("niceTry");
				}

				if (championCorrectCounter[correctOption] >= 10 && !achievements.fakeMain.unlocked) {
					unlockAchievement("fakeMain");
				}

				if (wrongChampionsSet.size >= 20 && !achievements.justTesting.unlocked) {
					achievements.justTesting.progress = wrongChampionsSet.size;
					unlockAchievement("justTesting");
				}
			}
		}

		if (selectedOption) {
			lastAnswers.push(selectedOption);

			if (lastAnswers.length > 5) {
				lastAnswers.shift();
			}

			if (lastAnswers.length >= 3) {
				const lastThree = lastAnswers.slice(-3);
				if (lastThree.every((answer) => answer === lastThree[0]) && !achievements.keyboardStuck.unlocked) {
					achievements.keyboardStuck.progress = 3;
					unlockAchievement("keyboardStuck");
				}
			}
		}

		if (isCorrect && wrongAttempts.length === 0) {
			unlockAchievement("firstTry");
		}

		if (isCorrect && wrongAttempts.length === 0) {
			achievements.threeInRow.progress++;
			if (achievements.threeInRow.progress >= 3) {
				unlockAchievement("threeInRow");
			}
		} else {
			achievements.threeInRow.progress = 0;
		}

		if (isCorrect && wrongAttempts.length <= 1) {
			achievements.almostOracle.progress++;
			if (achievements.almostOracle.progress >= 10) {
				unlockAchievement("almostOracle");
			}
		}

		if (isCorrect && wrongAttempts.length === 0) {
			achievements.goodStart.progress++;
			if (achievements.goodStart.progress >= 3) {
				unlockAchievement("goodStart");
			}
		} else {
			achievements.goodStart.progress = 0;
		}

		if (isCorrect && phraseTime > 120000) {
			unlockAchievement("worseThanZilean");
		}

		saveProgress();
	}

	function calculateLevenshteinDistance(a, b, options = null) {
		const matrix = [];

		for (let i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}
		for (let j = 0; j <= a.length; j++) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) === a.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
				}
			}
		}

		return matrix[b.length][a.length];
	}

	function resetRunProgress() {
		achievements.threeInRow.progress = 0;
		achievements.almostOracle.progress = 0;
		saveProgress();
	}

	function resetAllAchievements() {
		Object.keys(achievements).forEach((key) => {
			achievements[key].unlocked = false;
			if (achievements[key].progress !== undefined) {
				achievements[key].progress = 0;
			}
		});

		championCorrectCounter = {};
		championErrorCounter = {};
		wrongChampionsSet = new Set();
		lastAnswers = [];
		dailyPlayCount = {};
		weekendPlayCount = {};
		dailyLoginStreak = [];
		totalPlayCount = 0;
		uniqueCorrectChampions = new Set();
		unlockedChampions = [];

		localStorage.removeItem("achievements");
		localStorage.removeItem("unlockedChampions");
		localStorage.removeItem("championUnlockDates");

		updateModal();
		updateChampionsGrid();

		const confirmationToast = {
			name: "Conquistas Resetadas",
			description: "Todas as conquistas foram resetadas com sucesso!",
			icon: "",
		};
		showToast(confirmationToast);
	}

	function unlockChampion(champion) {
		if (!unlockedChampions.includes(champion)) {
			unlockedChampions.push(champion);

			const unlockedDates = JSON.parse(localStorage.getItem("championUnlockDates") || "{}");
			unlockedDates[champion] = formatDate(new Date());
			localStorage.setItem("championUnlockDates", JSON.stringify(unlockedDates));

			const championInfo = getChampionInfo(champion);
			if (championInfo) {
				const unlockNotification = {
					name: `${champion} Desbloqueado!`,
					description: championInfo.title,
					icon: championInfo.image,
				};
				showToast(unlockNotification);
			}

			saveProgress();
		}
	}

	function getChampionInfo(championName) {
		return championInfo[championName];
	}

	function saveProgress() {
		localStorage.setItem("achievements", JSON.stringify(achievements));
		localStorage.setItem("unlockedChampions", JSON.stringify(unlockedChampions));
	}

	function loadProgress() {
		const savedAchievements = localStorage.getItem("achievements");
		if (savedAchievements) {
			const parsed = JSON.parse(savedAchievements);
			Object.keys(parsed).forEach((key) => {
				if (achievements[key]) {
					achievements[key].unlocked = parsed[key].unlocked;
					if (parsed[key].progress !== undefined) {
						achievements[key].progress = parsed[key].progress;
					}
				}
			});
		}

		const savedChampions = localStorage.getItem("unlockedChampions");
		if (savedChampions) {
			unlockedChampions = JSON.parse(savedChampions);
		}
	}

	function registerGamePlayed() {
		const today = new Date().toLocaleDateString();
		dailyPlayCount[today] = (dailyPlayCount[today] || 0) + 1;

		if (dailyPlayCount[today] >= 5 && !achievements.havingFun.unlocked) {
			unlockAchievement("havingFun");
		}

		if (dailyPlayCount[today] >= 10 && !achievements.addictedNow.unlocked) {
			unlockAchievement("addictedNow");
		}

		const currentDate = new Date();
		const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
		if (isWeekend) {
			const weekendKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${Math.floor(
				currentDate.getDate() / 7
			)}`;
			weekendPlayCount[weekendKey] = (weekendPlayCount[weekendKey] || 0) + 1;

			if (weekendPlayCount[weekendKey] >= 30 && !achievements.rankedSunday.unlocked) {
				unlockAchievement("rankedSunday");
			}
		}

		saveProgress();
	}

	function init() {
		loadEncodedData();
		loadProgress();
		setupModal();
		setupResetButton();
	}

	return {
		checkAchievements,
		init,
		unlockChampion,
		resetRunProgress,
		resetAllAchievements,
		getChampionInfo,
		registerGamePlayed,
	};
})();

window.achievementSystem = achievementSystem;
