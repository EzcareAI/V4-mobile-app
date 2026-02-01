import Slider from "@react-native-community/slider";
import { Button } from "heroui-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

export type ScanCard = {
	id: string;
	type: "yesno" | "scale" | "choice";
	question: string;
	options?: string[];
};

interface ScanCardEngineProps {
	cards: ScanCard[];
	onComplete: (answers: Record<string, any>) => void;
}

export function ScanCardEngine({ cards, onComplete }: ScanCardEngineProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, any>>({});
	const [currentAnswer, setCurrentAnswer] = useState<any>(null);

	const progress = ((currentIndex + 1) / cards.length) * 100;
	const currentCard = cards[currentIndex];

	const handleAnswer = (value: any) => {
		setCurrentAnswer(value);
	};

	const handleNext = () => {
		if (currentAnswer === null) return;

		const newAnswers = { ...answers, [currentCard.id]: currentAnswer };
		setAnswers(newAnswers);
		setCurrentAnswer(null);

		if (currentIndex < cards.length - 1) {
			setCurrentIndex(currentIndex + 1);
		} else {
			onComplete(newAnswers);
		}
	};

	return (
		<View className="flex-1 p-6">
			{/* Progress Bar */}
			<View className="mb-8">
				<View className="mb-2 h-2 overflow-hidden rounded-full bg-secondary">
					<View
						className="h-full bg-primary"
						style={{ width: `${progress}%` }}
					/>
				</View>
				<Text className="text-muted text-sm">
					Question {currentIndex + 1} of {cards.length}
				</Text>
			</View>

			{/* Question */}
			<Text className="mb-8 font-bold text-2xl">{currentCard.question}</Text>

			{/* Answer Options */}
			<View className="flex-1">
				{currentCard.type === "yesno" && (
					<View className="gap-3">
						<Pressable
							className={`rounded-xl border-2 p-6 ${
								currentAnswer === true
									? "border-primary bg-primary/10"
									: "border-border bg-card"
							}`}
							onPress={() => handleAnswer(true)}
						>
							<Text className="text-center font-semibold text-lg">Yes</Text>
						</Pressable>
						<Pressable
							className={`rounded-xl border-2 p-6 ${
								currentAnswer === false
									? "border-primary bg-primary/10"
									: "border-border bg-card"
							}`}
							onPress={() => handleAnswer(false)}
						>
							<Text className="text-center font-semibold text-lg">No</Text>
						</Pressable>
					</View>
				)}

				{currentCard.type === "scale" && (
					<View>
						<Text className="mb-4 text-center font-bold text-4xl">
							{currentAnswer ?? 5}
						</Text>
						<Slider
							maximumTrackTintColor="#e5e7eb"
							maximumValue={10}
							minimumTrackTintColor="#3b82f6"
							minimumValue={0}
							onValueChange={handleAnswer}
							step={1}
							value={currentAnswer ?? 5}
						/>
						<View className="mt-2 flex-row justify-between">
							<Text className="text-muted text-sm">0 - None</Text>
							<Text className="text-muted text-sm">10 - Severe</Text>
						</View>
					</View>
				)}

				{currentCard.type === "choice" && currentCard.options && (
					<View className="gap-3">
						{currentCard.options.map((option) => (
							<Pressable
								className={`rounded-xl border-2 p-4 ${
									currentAnswer === option
										? "border-primary bg-primary/10"
										: "border-border bg-card"
								}`}
								key={option}
								onPress={() => handleAnswer(option)}
							>
								<Text
									className={`text-base ${
										currentAnswer === option ? "font-semibold" : "font-normal"
									}`}
								>
									{option}
								</Text>
							</Pressable>
						))}
					</View>
				)}
			</View>

			{/* Continue Button */}
			<Button
				className="mt-6 w-full"
				isDisabled={currentAnswer === null}
				onPress={handleNext}
				size="lg"
			>
				{currentIndex < cards.length - 1 ? "Next" : "Complete Scan"}
			</Button>
		</View>
	);
}
