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

(function () {
	const canvas = document.getElementById("bg-canvas");
	const ctx = canvas.getContext("2d");

	let loaded = 0;
	let failed = 0;

	let width, height;

	let tileWidth = 480;
	let tileHeight = 270;

	function setTileSizes() {
		const isMobile = window.innerWidth < 768;

		if (isMobile) {
			tileWidth = 240;
			tileHeight = 135;
		} else {
			tileWidth = 480;
			tileHeight = 270;
		}
	}

	const rotationAngle = -20 * (Math.PI / 180);
	const speedX = 0.5;
	const speedY = 0;

	let correctChampions = new Set();

	// Expor função para comunicação com script.js
	window.bgCanvas = {
		markChampionAsCorrect: function (championName) {
			correctChampions.add(championName);
		},
		resetCorrectChampions: function () {
			correctChampions.clear();
		},
	};

	function resizeCanvas() {
		width = canvas.width = window.innerWidth;
		height = canvas.height = window.innerHeight;

		calculateCoverageArea();
		setTileSizes();

		if (loaded > 0 && champions && loaded + failed === champions.length) {
			createTiles();
		}
	}

	let coverWidth, coverHeight;

	function calculateCoverageArea() {
		const diagonal = Math.sqrt(width * width + height * height);

		coverWidth = diagonal * 2;
		coverHeight = diagonal * 2;
	}

	setTileSizes();
	window.addEventListener("resize", resizeCanvas);
	resizeCanvas();

	const champions = [
		"Aatrox",
		"Ahri",
		"Akali",
		"Akshan",
		"Alistar",
		"Amumu",
		"Anivia",
		"Annie",
		"Ambessa",
		"Aphelios",
		"Ashe",
		"AurelionSol",
		"Azir",
		"Bard",
		"Belveth",
		"Blitzcrank",
		"Brand",
		"Braum",
		"Briar",
		"Caitlyn",
		"Camille",
		"Cassiopeia",
		"Chogath",
		"Corki",
		"Darius",
		"Diana",
		"Draven",
		"DrMundo",
		"Ekko",
		"Elise",
		"Evelynn",
		"Ezreal",
		"Fiddlesticks",
		"Fiora",
		"Fizz",
		"Galio",
		"Gangplank",
		"Garen",
		"Gnar",
		"Gragas",
		"Graves",
		"Gwen",
		"Hecarim",
		"Heimerdinger",
		"Illaoi",
		"Irelia",
		"Ivern",
		"Janna",
		"JarvanIV",
		"Jax",
		"Jayce",
		"Jhin",
		"Jinx",
		"Kaisa",
		"Kalista",
		"Karma",
		"Karthus",
		"Kassadin",
		"Katarina",
		"Kayle",
		"Kayn",
		"Kennen",
		"Khazix",
		"Kindred",
		"Kled",
		"KogMaw",
		"KSante",
		"Leblanc",
		"LeeSin",
		"Leona",
		"Lillia",
		"Lissandra",
		"Lucian",
		"Lulu",
		"Lux",
		"Malphite",
		"Malzahar",
		"Maokai",
		"MasterYi",
		"Milio",
		"MissFortune",
		"Mordekaiser",
		"Morgana",
		"Naafiri",
		"Nami",
		"Nasus",
		"Nautilus",
		"Neeko",
		"Nidalee",
		"Nilah",
		"Nocturne",
		"Nunu",
		"Olaf",
		"Orianna",
		"Ornn",
		"Pantheon",
		"Poppy",
		"Pyke",
		"Qiyana",
		"Quinn",
		"Rakan",
		"Rammus",
		"RekSai",
		"Rell",
		"Renata",
		"Renekton",
		"Rengar",
		"Riven",
		"Rumble",
		"Ryze",
		"Samira",
		"Sejuani",
		"Senna",
		"Seraphine",
		"Sett",
		"Shaco",
		"Shen",
		"Shyvana",
		"Singed",
		"Sion",
		"Sivir",
		"Skarner",
		"Sona",
		"Soraka",
		"Swain",
		"Sylas",
		"Syndra",
		"TahmKench",
		"Taliyah",
		"Talon",
		"Taric",
		"Teemo",
		"Thresh",
		"Tristana",
		"Trundle",
		"Tryndamere",
		"TwistedFate",
		"Twitch",
		"Udyr",
		"Urgot",
		"Varus",
		"Vayne",
		"Veigar",
		"Velkoz",
		"Vex",
		"Vi",
		"Viego",
		"Viktor",
		"Vladimir",
		"Volibear",
		"Warwick",
		// "Wukong", Off por algum motivo
		"Xayah",
		"Xerath",
		"XinZhao",
		"Yasuo",
		"Yone",
		"Yorick",
		"Yuumi",
		"Zac",
		"Zed",
		"Zeri",
		"Ziggs",
		"Zilean",
		"Zoe",
		"Zyra",
	];

	function applyCorrectEffect(originalCanvas) {
		const tempCanvas = document.createElement("canvas");
		const tempCtx = tempCanvas.getContext("2d");
		tempCanvas.width = originalCanvas.width;
		tempCanvas.height = originalCanvas.height;

		tempCtx.drawImage(originalCanvas, 0, 0);
		tempCtx.fillStyle = "rgba(35, 209, 96, 0.2)";
		tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

		tempCtx.strokeStyle = "rgba(35, 209, 96, 0.8)";
		tempCtx.lineWidth = 4;
		tempCtx.strokeRect(2, 2, tempCanvas.width - 4, tempCanvas.height - 4);

		const checkmarkSize = Math.min(40, tempCanvas.width / 6);

		tempCtx.fillStyle = "rgba(35, 209, 96, 0.6)";
		tempCtx.beginPath();
		tempCtx.arc(tempCanvas.width / 2, tempCanvas.height / 2, checkmarkSize, 0, Math.PI * 2);
		tempCtx.fill();

		tempCtx.strokeStyle = "white";
		tempCtx.lineWidth = Math.max(3, checkmarkSize / 10);
		tempCtx.beginPath();
		tempCtx.moveTo(tempCanvas.width / 2 - checkmarkSize * 0.4, tempCanvas.height / 2);
		tempCtx.lineTo(tempCanvas.width / 2, tempCanvas.height / 2 + checkmarkSize * 0.4);
		tempCtx.lineTo(tempCanvas.width / 2 + checkmarkSize * 0.4, tempCanvas.height / 2 - checkmarkSize * 0.4);
		tempCtx.stroke();

		return tempCanvas;
	}

	function shuffleArray(array) {
		const newArray = [...array];
		for (let i = newArray.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
		}
		return newArray;
	}

	function createFallbackImage() {
		const tempCanvas = document.createElement("canvas");
		const tempCtx = tempCanvas.getContext("2d");
		tempCanvas.width = tileWidth;
		tempCanvas.height = tileHeight;

		const gradient = tempCtx.createLinearGradient(0, 0, tileWidth, tileHeight);
		gradient.addColorStop(0, "rgba(10, 20, 40, 0.9)");
		gradient.addColorStop(1, "rgba(30, 50, 90, 0.9)");
		tempCtx.fillStyle = gradient;
		tempCtx.fillRect(0, 0, tileWidth, tileHeight);

		return tempCanvas;
	}

	const fallbackImage = createFallbackImage();
	const shuffledChampions = shuffleArray([...champions]);
	const images = {};
	let totalImages = shuffledChampions.length;

	let tiles = [];
	let availableChampionList = [];

	let gridOffsetX = 0;
	let gridOffsetY = 0;

	function processImage(img) {
		const tempCanvas = document.createElement("canvas");
		const tempCtx = tempCanvas.getContext("2d");
		tempCanvas.width = tileWidth;
		tempCanvas.height = tileHeight;

		const imgRatio = img.width / img.height;
		const tileRatio = tileWidth / tileHeight;

		let drawWidth,
			drawHeight,
			offsetX = 0,
			offsetY = 0;

		if (imgRatio > tileRatio) {
			drawHeight = tileHeight;
			drawWidth = img.width * (tileHeight / img.height);
			offsetX = (tileWidth - drawWidth) / 2;
		} else {
			drawWidth = tileWidth;
			drawHeight = img.height * (tileWidth / img.width);
			offsetY = (tileHeight - drawHeight) / 2;
		}

		tempCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

		tempCtx.fillStyle = "rgba(0, 0, 0, 0.65)";
		tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

		return tempCanvas;
	}

	function checkAllProcessed() {
		if (loaded + failed === champions.length) {
			availableChampionList = shuffleArray(Object.keys(images));
			createTiles();
			animate();
		}
	}

	function loadImages() {
		loaded = 0;
		failed = 0;

		const newFallbackImage = createFallbackImage();

		shuffledChampions.forEach((champ) => {
			const img = new Image();
			img.crossOrigin = "Anonymous";
			img.src = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ}_0.jpg`;
			img.onload = () => {
				images[champ] = processImage(img);
				loaded++;
				checkAllProcessed();
			};
			img.onerror = () => {
				images[champ] = newFallbackImage;
				failed++;
				checkAllProcessed();
			};
		});
	}

	loadImages();

	function createTile(x, y) {
		const champName = getNextChampion();

		return {
			x: x,
			y: y,
			champ: champName,
		};
	}

	// Criação de tiles iniciais para cobrir a tela
	function createTiles() {
		tiles = [];
		gridOffsetX = 0;
		gridOffsetY = 0;

		// Usar coverWidth/coverHeight para calcular quantos tiles são necessários
		const tilesNeededX = Math.ceil(coverWidth / tileWidth) + 4;
		const tilesNeededY = Math.ceil(coverHeight / tileHeight) + 4;

		availableChampionList = shuffleArray(Object.keys(images));

		for (let y = -tilesNeededY / 2; y < tilesNeededY / 2; y++) {
			for (let x = -tilesNeededX / 2; x < tilesNeededX / 2; x++) {
				tiles.push(createTile(x * tileWidth, y * tileHeight));
			}
		}
	}

	function getNextChampion() {
		if (availableChampionList.length === 0) {
			availableChampionList = shuffleArray(Object.keys(images));
		}

		return availableChampionList.shift();
	}

	function updateAvailableChampions() {
		const usedChampions = new Set();
		tiles.forEach((tile) => {
			usedChampions.add(tile.champ);
		});

		// Filtrar apenas os que não estão na tela para disponíveis
		availableChampionList = Object.keys(images).filter((champ) => !usedChampions.has(champ));

		availableChampionList = shuffleArray(availableChampionList);

		if (availableChampionList.length === 0) {
			availableChampionList = shuffleArray(Object.keys(images));
		}
	}

	function animate() {
		if (Object.keys(images).length === 0) return;

		ctx.clearRect(0, 0, width, height);

		// Atualizar o offset global do grid
		gridOffsetX += speedX;
		gridOffsetY += speedY;

		let tilesToRemove = [];
		let newTiles = [];

		ctx.save();
		ctx.translate(width / 2, height / 2);
		ctx.rotate(rotationAngle);
		ctx.translate(-width / 2, -height / 2);

		const maxX = Math.max(...tiles.map((t) => t.x));
		const maxY = Math.max(...tiles.map((t) => t.y));
		const minX = Math.min(...tiles.map((t) => t.x));
		const minY = Math.min(...tiles.map((t) => t.y));

		ctx.restore();

		if (maxX + gridOffsetX < coverWidth / 2) {
			const uniqueYPositions = [...new Set(tiles.map((t) => t.y))].sort((a, b) => a - b);
			uniqueYPositions.forEach((yPos) => {
				newTiles.push(createTile(maxX + tileWidth, yPos));
			});
		}

		if (minX + gridOffsetX > -coverWidth / 2) {
			const uniqueYPositions = [...new Set(tiles.map((t) => t.y))].sort((a, b) => a - b);
			uniqueYPositions.forEach((yPos) => {
				newTiles.push(createTile(minX - tileWidth, yPos));
			});
		}

		if (maxY + gridOffsetY < coverHeight / 2) {
			const uniqueXPositions = [...new Set(tiles.map((t) => t.x))].sort((a, b) => a - b);
			uniqueXPositions.forEach((xPos) => {
				newTiles.push(createTile(xPos, maxY + tileHeight));
			});
		}

		if (minY + gridOffsetY > -coverHeight / 2) {
			const uniqueXPositions = [...new Set(tiles.map((t) => t.x))].sort((a, b) => a - b);
			uniqueXPositions.forEach((xPos) => {
				newTiles.push(createTile(xPos, minY - tileHeight));
			});
		}

		for (let i = 0; i < tiles.length; i++) {
			const tile = tiles[i];
			const tileX = tile.x + gridOffsetX;
			const tileY = tile.y + gridOffsetY;

			const distanceFromCenter = Math.sqrt(Math.pow(tileX, 2) + Math.pow(tileY, 2));

			if (distanceFromCenter > coverWidth) {
				tilesToRemove.push(i);
			}
		}

		ctx.save();
		ctx.translate(width / 2, height / 2);
		ctx.rotate(rotationAngle);

		for (let i = 0; i < tiles.length; i++) {
			const tile = tiles[i];
			const img = images[tile.champ] || fallbackImage;

			const x = tile.x + gridOffsetX;
			const y = tile.y + gridOffsetY;

			if (Math.abs(x) < coverWidth / 2 && Math.abs(y) < coverHeight / 2) {
				const isCorrect = correctChampions.has(tile.champ);

				ctx.save();
				ctx.translate(x + tileWidth / 2, y + tileHeight / 2);

				if (isCorrect) {
					const correctImg = applyCorrectEffect(img);
					ctx.drawImage(correctImg, -tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight);
				} else {
					ctx.drawImage(img, -tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight);
				}

				ctx.restore();
			}
		}

		ctx.restore();

		const uniqueSortedIndicesToRemove = [...new Set(tilesToRemove)].sort((a, b) => b - a);
		for (let i = 0; i < uniqueSortedIndicesToRemove.length; i++) {
			tiles.splice(uniqueSortedIndicesToRemove[i], 1);
		}

		tiles = tiles.concat(newTiles);

		if (Math.random() < 0.03) {
			updateAvailableChampions();
		}

		requestAnimationFrame(animate);
	}
})();
