#include "wordle_analyzer.h"

#include <exception>
#include <fstream>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

int failures = 0;

void expect_equal(const std::string& actual, const std::string& expected, const std::string& name) {
    if (actual != expected) {
        std::cerr << "FAIL " << name << ": expected " << expected << ", got " << actual << '\n';
        ++failures;
    }
}

void expect_size(std::size_t actual, std::size_t expected, const std::string& name) {
    if (actual != expected) {
        std::cerr << "FAIL " << name << ": expected " << expected << ", got " << actual << '\n';
        ++failures;
    }
}

template <typename Function>
void expect_throw(Function function, const std::string& name) {
    try {
        function();
        std::cerr << "FAIL " << name << ": expected an exception\n";
        ++failures;
    } catch (const std::exception&) {
    }
}

}  // namespace

int main() {
    expect_equal(wordle::score_guess("cigar", "cigar"), "22222", "exact match");
    expect_equal(wordle::score_guess("cigar", "bloom"), "00000", "no matching letters");
    expect_equal(wordle::score_guess("cigar", "abode"), "10000", "one yellow letter");
    expect_equal(wordle::score_guess("panel", "apple"), "11011", "repeated letters in guess");
    expect_equal(wordle::score_guess("apple", "panel"), "11011", "repeated letters in secret");
    expect_equal(wordle::score_guess("CIGAR", "cigar"), "22222", "uppercase input");

    expect_throw([] { wordle::score_guess("four", "cigar"); }, "invalid word length");
    expect_throw([] { wordle::parse_guess("app1e01201"); }, "nonalphabetic characters");
    expect_throw([] { wordle::parse_guess("apple01301"); }, "invalid color pattern");
    expect_throw([] { wordle::load_words("file-that-does-not-exist.txt"); }, "missing dictionary file");

    const std::vector<std::string> words{"cigar", "rebut", "sissy"};
    const std::vector<wordle::Guess> guesses{{"cigar", "00000"}, {"bloom", "22222"}};
    expect_size(wordle::find_candidates(words, guesses).size(), 0, "multiple guesses with no candidates");

    if (failures == 0) {
        std::cout << "All tests passed.\n";
    }
    return failures == 0 ? 0 : 1;
}
