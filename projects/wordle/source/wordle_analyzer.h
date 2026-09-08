#pragma once

#include <string>
#include <utility>
#include <vector>

namespace wordle {

using Guess = std::pair<std::string, std::string>;

std::string score_guess(std::string secret, std::string guess);
Guess parse_guess(const std::string& input);
std::vector<std::string> load_words(const std::string& filename);
std::vector<std::string> find_candidates(
    const std::vector<std::string>& words,
    const std::vector<Guess>& guesses);

}  // namespace wordle
