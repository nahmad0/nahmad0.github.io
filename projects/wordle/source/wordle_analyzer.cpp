#include "wordle_analyzer.h"

#include <algorithm>
#include <cctype>
#include <fstream>
#include <stdexcept>
#include <unordered_map>

namespace {

std::string trim(const std::string& value) {
    const auto first = std::find_if_not(value.begin(), value.end(), [](unsigned char c) {
        return std::isspace(c) != 0;
    });
    const auto last = std::find_if_not(value.rbegin(), value.rend(), [](unsigned char c) {
        return std::isspace(c) != 0;
    }).base();
    return first < last ? std::string(first, last) : std::string{};
}

void validate_word(const std::string& word, const std::string& label) {
    if (word.size() != 5) {
        throw std::invalid_argument(label + " must contain exactly five letters.");
    }
    if (!std::all_of(word.begin(), word.end(), [](unsigned char c) { return std::isalpha(c) != 0; })) {
        throw std::invalid_argument(label + " must contain letters only.");
    }
}

void lowercase(std::string& value) {
    std::transform(value.begin(), value.end(), value.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });
}

}  // namespace

namespace wordle {

std::string score_guess(std::string secret, std::string guess) {
    validate_word(secret, "Secret");
    validate_word(guess, "Guess");
    lowercase(secret);
    lowercase(guess);

    std::string result = "00000";
    std::unordered_map<char, int> remaining;

    for (std::size_t i = 0; i < secret.size(); ++i) {
        if (secret[i] == guess[i]) {
            result[i] = '2';
        } else {
            ++remaining[secret[i]];
        }
    }

    for (std::size_t i = 0; i < guess.size(); ++i) {
        if (result[i] != '2' && remaining[guess[i]] > 0) {
            result[i] = '1';
            --remaining[guess[i]];
        }
    }
    return result;
}

Guess parse_guess(const std::string& input) {
    const std::string cleaned = trim(input);
    if (cleaned.size() != 10) {
        throw std::invalid_argument("Input must be five letters followed by five color digits.");
    }

    std::string word = cleaned.substr(0, 5);
    const std::string colors = cleaned.substr(5, 5);
    validate_word(word, "Guess");
    if (!std::all_of(colors.begin(), colors.end(), [](char c) {
            return c == '0' || c == '1' || c == '2';
        })) {
        throw std::invalid_argument("Color pattern may contain only 0, 1, and 2.");
    }
    lowercase(word);
    return {word, colors};
}

std::vector<std::string> load_words(const std::string& filename) {
    std::ifstream file(filename);
    if (!file) {
        throw std::runtime_error("Could not open dictionary file: " + filename);
    }

    std::vector<std::string> words;
    std::string line;
    std::size_t line_number = 0;
    while (std::getline(file, line)) {
        ++line_number;
        line = trim(line);
        try {
            validate_word(line, "Dictionary entry");
        } catch (const std::invalid_argument& error) {
            throw std::runtime_error(filename + ":" + std::to_string(line_number) + ": " + error.what());
        }
        lowercase(line);
        words.push_back(line);
    }
    return words;
}

std::vector<std::string> find_candidates(
    const std::vector<std::string>& words,
    const std::vector<Guess>& guesses) {
    std::vector<std::string> matches;
    for (const std::string& candidate : words) {
        const bool matches_all = std::all_of(guesses.begin(), guesses.end(), [&](const Guess& guess) {
            return score_guess(candidate, guess.first) == guess.second;
        });
        if (matches_all) {
            matches.push_back(candidate);
        }
    }
    return matches;
}

}  // namespace wordle
