#pragma once

#include <string>
#include <vector>

// Shared helpers for translating JavaScript-style regular expressions
// into RE2-compatible patterns.
bool translateRegExp(const char *data, size_t size, bool multiline, std::vector<char> &buffer);
std::string escapeRegExp(const char *data, size_t size);

