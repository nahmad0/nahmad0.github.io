#include "wordle_analyzer.h"

#include <exception>
#include <iostream>
#include <string>
#include <vector>

int main(int argc, char* argv[]) {
    const std::string dictionary = argc > 1 ? argv[1] : "fives.txt";

    try {
        const std::vector<std::string> words = wordle::load_words(dictionary);
        std::vector<wordle::Guess> guesses;

        std::cout << "Enter each guess as five letters plus its five-digit pattern.\n"
                     "Use 2 for green, 1 for yellow, and 0 for gray (example: apple01201).\n"
                     "Press Enter on an empty line to analyze.\n\n";

        for (std::string input; std::cout << "> " && std::getline(std::cin, input) && !input.empty();) {
            try {
                guesses.push_back(wordle::parse_guess(input));
            } catch (const std::invalid_argument& error) {
                std::cout << "Invalid input: " << error.what() << '\n';
            }
        }

        const std::vector<std::string> matches = wordle::find_candidates(words, guesses);
        std::cout << "\nPossible words:\n";
        for (const std::string& word : matches) {
            std::cout << word << '\n';
        }
        std::cout << "\nTotal: " << matches.size() << " possible word(s).\n";
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "Error: " << error.what() << '\n';
        return 1;
    }
}
