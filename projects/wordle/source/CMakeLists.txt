cmake_minimum_required(VERSION 3.16)
project(WordlePatternAnalyzer VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(wordle_analyzer wordle_analyzer.cpp)
target_include_directories(wordle_analyzer PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

add_executable(wordle main.cpp)
target_link_libraries(wordle PRIVATE wordle_analyzer)

enable_testing()
add_executable(wordle_tests tests.cpp)
target_link_libraries(wordle_tests PRIVATE wordle_analyzer)
add_test(NAME wordle_tests COMMAND wordle_tests)
