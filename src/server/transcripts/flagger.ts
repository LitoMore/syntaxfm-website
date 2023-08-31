// import { createFFmpeg, fetchFile, type ProgressCallback } from '@ffmpeg.wasm/main';
import { FFmpeg } from '@ffmpeg.wasm/main';
import type { Show } from '@prisma/client';
import { readFile, unlink, writeFile } from 'fs/promises';
import { logProgress } from './logProgress';

const flagPaths = ['./audio/wes-flagger.mp3', './audio/scott-flagger.mp3'];

export type ProgressEvent = {
	duration?: number;
	ratio?: number;
	time: number;
	percentage: number;
};

/**
 * Concatenates a show with flagger audio to help with diatirization
 * @returns {Promise<Buffer>} - The concatenated show
 * @param {string} mp3URL - The URL of the show to concat
 **/
export async function addFlaggerAudio(show: Show): Promise<Buffer> {
	console.log('ADDING FLAGGER AUDIO');
	const url = new URL(show.url);
	// Get the filename
	const fileName = url.pathname.split('/').pop() || `${show.number}.mp3`;
	//  Get the base name
	const [baseName, extension] = fileName.split('.');
	// create the output filename
	const outputFilename = `${show.title}-flagged.${extension}`;
	console.log(`Downloading #${show.number} - ${show.title}`);
	// const { ffMpegProgress } = createProgressLogger(fileName);
	// Create ffmpeg instance
	// const ffmpeg = createFFmpeg({
	//   progress: ffMpegProgress,
	// });
	console.log('Creating ffmpeg instance');
	const ffmpeg = await FFmpeg.create({
		log: true,
		logger: (type, ...message) => {
			logProgress(message.join(' '));
		}
	});
	console.log('Loading ffmpeg');
	// await ffmpeg.load();
	// 1. download the show
	console.log(`Fetching ${url}`);
	const fetchBuffer = await fetch(url)
		.then((res) => res.arrayBuffer())
		.then((buf) => Buffer.from(new Uint8Array(buf)));
	// Load it into ffmpeg memory
	// ffmpeg.FS('writeFile', fileName, await fetchFile(fetchBuffer));
	ffmpeg.fs.writeFile(fileName, fetchBuffer);

	console.log(`wrote ${fileName} to ffmpeg memory`);
	// Write Flaggers to ffmpeg memory
	for (const [i, flagPath] of flagPaths.entries()) {
		const __dirname = new URL('.', import.meta.url).pathname;
		const flagBuffer = await readFile(__dirname + flagPath);
		ffmpeg.fs.writeFile(`flagger-${baseName}-${i}.mp3`, flagBuffer);
		console.log(`wrote flagger-${baseName}-${i}.mp3 to ffmpeg memory`);
	}

	// Create the Command
	const command = [
		'-i',
		fileName,
		...flagPaths.map((flagPath, i) => ['-i', `flagger-${baseName}-${i}.mp3`]).flat(),
		'-filter_complex',
		'[0:a:0][1:a:0][2:a:0]concat=n=3:v=0:a=1[outa]',
		'-map',
		'[outa]',
		outputFilename
	];

	console.log(`Running ffmpeg with command: ${command.join(' ')}`);
	// Run ffmpeg
	await ffmpeg.run(...command);
	// Get the Uint8Array
	const data = ffmpeg.fs.readFile(outputFilename);
	// Convert to buffer
	const buffer = Buffer.from(data.buffer);
	// progressBar.stop();
	console.log(`FFMpeg Merging `);
	// Write to disk from buffer for DEbugging
	// await writeFile(`./audio-out/${outputFilename}`, buffer);
	return buffer;
}