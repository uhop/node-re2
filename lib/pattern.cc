#include "./pattern.h"
#include "./unicode_properties.h"
#include "./wrapped_re2.h"

#include <cstdint>
#include <cstdio>
#include <cstring>
#include <map>
#include <string>

static char hex[] = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'};

inline bool isUpperCaseAlpha(char ch)
{
	return 'A' <= ch && ch <= 'Z';
}

inline bool isHexadecimal(char ch)
{
	return ('0' <= ch && ch <= '9') || ('A' <= ch && ch <= 'F') || ('a' <= ch && ch <= 'f');
}

static std::map<std::string, std::string> unicodeClasses = {
	{"Uppercase_Letter", "Lu"},
	{"Lowercase_Letter", "Ll"},
	{"Titlecase_Letter", "Lt"},
	{"Cased_Letter", "LC"},
	{"Modifier_Letter", "Lm"},
	{"Other_Letter", "Lo"},
	{"Letter", "L"},
	{"Nonspacing_Mark", "Mn"},
	{"Spacing_Mark", "Mc"},
	{"Enclosing_Mark", "Me"},
	{"Mark", "M"},
	{"Decimal_Number", "Nd"},
	{"Letter_Number", "Nl"},
	{"Other_Number", "No"},
	{"Number", "N"},
	{"Connector_Punctuation", "Pc"},
	{"Dash_Punctuation", "Pd"},
	{"Open_Punctuation", "Ps"},
	{"Close_Punctuation", "Pe"},
	{"Initial_Punctuation", "Pi"},
	{"Final_Punctuation", "Pf"},
	{"Other_Punctuation", "Po"},
	{"Punctuation", "P"},
	{"Math_Symbol", "Sm"},
	{"Currency_Symbol", "Sc"},
	{"Modifier_Symbol", "Sk"},
	{"Other_Symbol", "So"},
	{"Symbol", "S"},
	{"Space_Separator", "Zs"},
	{"Line_Separator", "Zl"},
	{"Paragraph_Separator", "Zp"},
	{"Separator", "Z"},
	{"Control", "Cc"},
	{"Format", "Cf"},
	{"Surrogate", "Cs"},
	{"Private_Use", "Co"},
	{"Unassigned", "Cn"},
	{"Other", "C"},
};

static const UnicodePropertyTable *lookupTable(const UnicodePropertyTable *table, size_t count, const std::string &name)
{
	for (size_t i = 0; i < count; ++i)
	{
		if (name == table[i].name)
		{
			return &table[i];
		}
	}
	return nullptr;
}

static const UnicodePropertyTable *findBinaryProperty(const std::string &name)
{
	return lookupTable(kBinaryProperties, kBinaryPropertiesCount, name);
}

static const UnicodePropertyTable *findScriptExtension(const std::string &name)
{
	return lookupTable(kScriptExtensions, kScriptExtensionsCount, name);
}

static void appendHexRange(std::string &out, uint32_t lo, uint32_t hi)
{
	char buf[32];
	if (lo == hi)
	{
		std::snprintf(buf, sizeof(buf), "\\x{%X}", lo);
	}
	else
	{
		std::snprintf(buf, sizeof(buf), "\\x{%X}-\\x{%X}", lo, hi);
	}
	out += buf;
}

static void appendPropertyRanges(std::string &out, const UnicodePropertyTable *table)
{
	for (size_t i = 0; i < table->count; ++i)
	{
		appendHexRange(out, table->ranges[i].lo, table->ranges[i].hi);
	}
}

static void appendPropertyComplementRanges(std::string &out, const UnicodePropertyTable *table)
{
	const uint32_t kMaxCp = 0x10FFFFu;
	uint32_t cursor = 0;
	for (size_t i = 0; i < table->count; ++i)
	{
		uint32_t lo = table->ranges[i].lo;
		uint32_t hi = table->ranges[i].hi;
		if (cursor < lo)
		{
			appendHexRange(out, cursor, lo - 1);
		}
		cursor = hi + 1;
	}
	if (cursor <= kMaxCp)
	{
		appendHexRange(out, cursor, kMaxCp);
	}
}

static void emitProperty(std::string &out, const UnicodePropertyTable *table, bool negate, bool inCharClass)
{
	if (inCharClass)
	{
		if (negate)
		{
			appendPropertyComplementRanges(out, table);
		}
		else
		{
			appendPropertyRanges(out, table);
		}
	}
	else
	{
		out += negate ? "[^" : "[";
		appendPropertyRanges(out, table);
		out += "]";
	}
}

static bool stripPrefix(const std::string &name, const char *prefix, std::string &out)
{
	size_t n = std::strlen(prefix);
	if (name.size() > n && !std::strncmp(name.c_str(), prefix, n))
	{
		out = name.substr(n);
		return true;
	}
	return false;
}

bool translateRegExp(const char *data, size_t size, bool multiline, std::vector<char> &buffer)
{
	std::string result;
	bool changed = false;
	bool inCharClass = false;

	if (!size)
	{
		result = "(?:)";
		changed = true;
	}
	else if (multiline)
	{
		result = "(?m)";
		changed = true;
	}

	for (size_t i = 0; i < size;)
	{
		char ch = data[i];
		if (ch == '\\')
		{
			if (i + 1 < size)
			{
				ch = data[i + 1];
				switch (ch)
				{
				case '\\':
					result += "\\\\";
					i += 2;
					continue;
				case 'c':
					if (i + 2 < size)
					{
						ch = data[i + 2];
						if (isUpperCaseAlpha(ch))
						{
							result += "\\x";
							result += hex[((ch - '@') / 16) & 15];
							result += hex[(ch - '@') & 15];
							i += 3;
							changed = true;
							continue;
						}
					}
					result += "\\c";
					i += 2;
					continue;
				case 'u':
					if (i + 2 < size)
					{
						ch = data[i + 2];
						if (isHexadecimal(ch))
						{
							result += "\\x{";
							result += ch;
							i += 3;
							for (size_t j = 0; j < 3 && i < size; ++i, ++j)
							{
								ch = data[i];
								if (!isHexadecimal(ch))
								{
									break;
								}
								result += ch;
							}
							result += '}';
							changed = true;
							continue;
						}
						else if (ch == '{')
						{
							result += "\\x";
							i += 2;
							changed = true;
							continue;
						}
					}
					result += "\\u";
					i += 2;
					continue;
				case 'p':
				case 'P':
					if (i + 2 < size) {
						if (data[i + 2] == '{') {
							size_t j = i + 3;
							while (j < size && data[j] != '}') ++j;
							if (j < size) {
								std::string name(data + i + 3, j - i - 3);
								bool negate = data[i + 1] == 'P';
								std::string stripped;

								// Script_Extensions=Hani / scx=Hani — RE2 has no native scx;
								// expand to a codepoint-range character class.
								const UnicodePropertyTable *scx = nullptr;
								if (stripPrefix(name, "Script_Extensions=", stripped) || stripPrefix(name, "scx=", stripped))
								{
									scx = findScriptExtension(stripped);
								}
								if (scx)
								{
									emitProperty(result, scx, negate, inCharClass);
									i = j + 1;
									changed = true;
									continue;
								}

								// General_Category=Letter / gc=Letter — strip prefix so the
								// existing long-name → short-name map can resolve it.
								if (stripPrefix(name, "General_Category=", stripped) || stripPrefix(name, "gc=", stripped))
								{
									name = stripped;
								}

								// Binary property — expand into a codepoint-range character
								// class. Covers Emoji, Alphabetic, ASCII, ID_Start, etc.
								const UnicodePropertyTable *binary = findBinaryProperty(name);
								if (binary)
								{
									emitProperty(result, binary, negate, inCharClass);
									i = j + 1;
									changed = true;
									continue;
								}

								// Otherwise, fall through to RE2 (handles General_Category
								// short names and Script names natively). Long GC names get
								// translated to the short form via the existing map.
								result += "\\";
								result += data[i + 1];
								if (unicodeClasses.find(name) != unicodeClasses.end()) {
									name = unicodeClasses[name];
								} else if (name.size() > 7 && !strncmp(name.c_str(), "Script=", 7)) {
									name = name.substr(7);
								} else if (name.size() > 3 && !strncmp(name.c_str(), "sc=", 3)) {
									name = name.substr(3);
								}
								if (name.size() == 1) {
									result += name;
								} else {
									result += "{";
									result += name;
									result += "}";
								}
								i = j + 1;
								changed = true;
								continue;
							}
						}
					}
					result += "\\";
					result += data[i + 1];
					i += 2;
					continue;
				default:
					result += "\\";
					size_t sym_size = getUtf8CharSize(ch);
					result.append(data + i + 1, sym_size);
					i += sym_size + 1;
					continue;
				}
			}
		}
		else if (ch == '/')
		{
			result += "\\/";
			i += 1;
			changed = true;
			continue;
		}
		else if (ch == '(' && i + 2 < size && data[i + 1] == '?' && data[i + 2] == '<')
		{
			if (i + 3 >= size || (data[i + 3] != '=' && data[i + 3] != '!'))
			{
				result += "(?P<";
				i += 3;
				changed = true;
				continue;
			}
		}
		else if (ch == '[' && !inCharClass)
		{
			inCharClass = true;
		}
		else if (ch == ']' && inCharClass)
		{
			inCharClass = false;
		}
		size_t sym_size = getUtf8CharSize(ch);
		result.append(data + i, sym_size);
		i += sym_size;
	}

	if (!changed)
	{
		return false;
	}

	buffer.resize(0);
	buffer.insert(buffer.end(), result.data(), result.data() + result.size());
	buffer.push_back('\0');

	return true;
}

std::string escapeRegExp(const char *data, size_t size)
{
	std::string result;

	if (!size)
	{
		result = "(?:)";
	}

	size_t prevBackSlashes = 0;
	for (size_t i = 0; i < size;)
	{
		char ch = data[i];
		if (ch == '\\')
		{
			++prevBackSlashes;
		}
		else if (ch == '/' && !(prevBackSlashes & 1))
		{
			result += "\\/";
			i += 1;
			prevBackSlashes = 0;
			continue;
		}
		else
		{
			prevBackSlashes = 0;
		}
		size_t sym_size = getUtf8CharSize(ch);
		result.append(data + i, sym_size);
		i += sym_size;
	}

	return result;
}
